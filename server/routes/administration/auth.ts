import { NextFunction } from 'express';

import { Router } from '../../core/express/router';
import { Server } from '../../core/server';
import { IRequest } from '../../core/models/express/request';
import { IResponse } from '../../core/models/express/response';
import { TokenRepository } from '../../repositories/token';
import { Passport } from '../../core/auth/passport';

export class AuthRouter extends Router {

  tokenRepository: TokenRepository;

  constructor(server: Server) {
    super(server);
    this.tokenRepository = new TokenRepository(this.server);
  }

  initRoutes() {
    this.router.route('/login')
      .post(Passport.local, this.authenticate.bind(this));

    this.router.route('/logout')
      .post(Passport.bearer, this.invalidate.bind(this));
  }

  async authenticate(request: IRequest, response: IResponse, next: NextFunction) {
    try {
      const user = request.user;

      if (!user) {
        throw new Error('Not found!');
      }

      const dbToken = await this.tokenRepository.create(token => {
        token.user = <any>user._id;
        token.type = 'admin';
        token.expireAt = new Date(Date.now() + 5 * 24 * 3600 * 1000);
      });

      delete user.passwordHash;

      response.data = {
        'user': user,
        'accessToken': dbToken.token
      };
      next();
    } catch (error) {
      next(Router.handleError(error, request, response));
    }
  }

  async invalidate(request: IRequest, response: IResponse, next: NextFunction) {
    try {
      await this.tokenRepository.deleteHardByQuery({
        'token': request.token
      });

      delete request.user;
      delete request.token;

      response.emptyResponse = true;
      next();
    } catch (error) {
      next(Router.handleError(error, request, response));
    }
  }
}
