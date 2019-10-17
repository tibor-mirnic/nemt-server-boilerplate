import * as passport from 'passport';
import { Strategy as Local } from 'passport-local';
import { Strategy as Bearer } from 'passport-http-bearer';

import { Server } from '../server';
import { IRequest } from '../models/express/request';
import { AuthenticationError } from '../error/auth';
import { ForbiddenError } from '../error/forbidden';
import { Util } from '../util/util';
import { GoogleUtil } from '../util/google';
import { StrategiesRepository } from '../../repositories/strategies';
import { IUser } from '../../db/models/user/user';
import { TokenRepository } from '../../repositories/token';

export class PassportStrategies {
  strategiesRepository: StrategiesRepository;
  tokenRepository: TokenRepository;

  constructor(private server: Server) {
    this.strategiesRepository = new StrategiesRepository(server);
    this.tokenRepository = new TokenRepository(server);
  }

  build() {
    passport.use('local', new Local(
      { usernameField: 'email', passReqToCallback: true },
      this.local.bind(this)
    ));

    passport.use('bearer', new Bearer(
      this.bearer.bind(this)
    ));
  }

  async local(request: IRequest, email: string, password: string, done: (err: any, user?: IUser) => void) {
    try {
      if (!email || !password) {
        throw new AuthenticationError('Missing email or password fields!');
      }

      const dbUser = await this.strategiesRepository.findOne({
        'email': email,
        'status': 'active'
      });

      if (!dbUser) {
        throw new AuthenticationError('Access credentials are incorrect!');
      }

      if (request.body.googleLogin) {
        const data: any = await GoogleUtil.validateToken(this.server.constants.googleTokenAuth, password, this.server.environment.googleConfiguration.clientId);

        if (data.email && data.email !== email) {
          throw new AuthenticationError('Login email mismatch!');
        }
      } else if (!Util.compareHash(password, dbUser.passwordHash)) {
        throw new AuthenticationError('Access credentials are incorrect!');
      }

      return done(null, dbUser);
    } catch (error) {
      done(error);
    }
  }

  async bearer(token: string, done: (err: any, user?: IUser, token?: string) => void) {
    try {
      const errorObj = new ForbiddenError('Unauthorized!');

      if (typeof token === 'undefined' || token === '') {
        throw errorObj;
      }

      const dbToken = await this.tokenRepository.findOne({
        'token': token,
        'type': { $in: ['access', 'admin'] }
      });

      if (!dbToken) {
        throw errorObj;
      }

      if (!dbToken.user) {
        throw errorObj;
      }

      const dbUser = await this.strategiesRepository.findOne({
        '_id': dbToken.user,
        'status': 'active'
      });

      if (!dbUser) {
        throw errorObj;
      }

      return done(null, dbUser, token);
    } catch (error) {
      done(error);
    }
  }
}
