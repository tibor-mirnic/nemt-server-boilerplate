import * as passport from 'passport';
import { Strategy as Local } from 'passport-local';
import { Strategy as Bearer } from 'passport-http-bearer';

import { Document } from 'mongoose';

import { Server } from './../server';
import { IRequest } from './../models/express/request';
import { IPassportInfo } from './../models/passport';
import { AuthenticationError } from './../error/auth';
import { ForbiddenError } from './../error/forbidden';
import { Util } from './../util/util';
import { GoogleUtil } from './../util/google';

import { UserRepository } from './../../repositories/user';
import { IUser } from './../../db/models/user/user';

import { TokenRepository } from './../../repositories/token';

export class PassportStrategies {
  server: Server;
  userRepository: UserRepository;
  tokenRepository: TokenRepository;

  constructor(server: Server) {
    this.server = server;

    this.userRepository = new UserRepository(this.server, this.server.systemUserId);
    this.tokenRepository = new TokenRepository(server);

    this.build();
  }

  build() {
    passport.use('local', new Local (
      { usernameField: 'email', passReqToCallback: true},
      this.local.bind(this)
    ));    

    passport.use('bearer', new Bearer(      
      this.bearer.bind(this)
    ));    
  }

  async local(request: IRequest, email: string, password: string, done: (err: any, user?: Document & IUser, info?: IPassportInfo) => void) {
    try {
      if (!email || !password) {
        throw new AuthenticationError('Missing email or password fields!');
      }

      let dbUser = await this.userRepository.findOne({
        'email': email,
        'status': 'active'
      });

      if(!dbUser) {
        throw new AuthenticationError('Access credentials are incorrect!');
      }

      if(request.body.googleLogin) {
        let data: any = await GoogleUtil.validateToken(password, this.server.environment.googleConfiguration.clientId, this.server.constants.googleTokenAuth);

        if(data.email && data.email !== email) {
          throw new AuthenticationError('Login email mismatch!');
        }
      }
      else if(!Util.compareHash(password, dbUser.passwordHash)) {
        throw new AuthenticationError('Access credentials are incorrect!');
      }      

      return done(null, dbUser);
    }
    catch(error) {
      done(error);
    }
  }

  async bearer(token: string, done: (err: any, user?: Document & IUser, info?: IPassportInfo) => void) {
    try {
      let errorObj = new ForbiddenError('Unauthorized!');

      if(typeof(token) === 'undefined' || token === '') {
        throw errorObj;
      }

      let dbToken = await this.tokenRepository.findOne({
        'token': token,
        'type': { $in: ['access', 'admin'] }
      });

      if(!dbToken) {
        throw errorObj;
      }

      if(!dbToken.user) {
        throw errorObj;
      }

      let dbUser = await this.userRepository.findOne({
        '_id': dbToken.user.toString(),
        'status': 'active' 
      });

      if(!dbUser) {
        throw errorObj;
      }

      return done(null, dbUser, {
        token: token
      });
    }
    catch(error) {
      done(error);
    }
  }
}