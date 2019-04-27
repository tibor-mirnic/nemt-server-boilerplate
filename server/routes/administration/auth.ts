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
  }

  async authenticate(request: IRequest, response: IResponse, next: NextFunction) {
    try {
      const user = request.user;

      if (!user) {
        throw new Error('Not found!');
      }

      const dbToken = await this.tokenRepository.create(token => {
        token.user = user._id.toString();
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
}
