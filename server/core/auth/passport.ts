import * as passport from 'passport';
import { IVerifyOptions } from 'passport-http-bearer';
import { NextFunction } from 'express';

import { Server } from '../server';
import { IRequest } from '../models/express/request';
import { IResponse } from '../models/express/response';
import { ForbiddenError } from '../error/forbidden';
import { IUser } from '../../db/models/user/user';
import { PassportStrategies } from './strategies';

export class Passport {
  server: Server;
  strategies: PassportStrategies;

  constructor(server: Server) {
    this.server = server;

    this.strategies = new PassportStrategies(server);
  }

  local(request: IRequest, response: IResponse, next: NextFunction) {
    passport.authenticate('local', { session: false },
      (error: any, user: IUser) => {
        if (error) {
          next(error);
        }

        request.user = user;
        next();
      }
    )(request, response, next);
  }

  bearer(request: IRequest, response: IResponse, next: NextFunction) {
    passport.authenticate('bearer', { session: false },
      (error: any, user: IUser, options?: IVerifyOptions | string) => {
        if (error) {
          next(error);
        }

        if (!user) {
          next(new ForbiddenError('Unauthorized!'));
        }

        request.user = user;

        if (options && typeof options === 'string') {
          request.token = options;
        }

        next();
      }
    )(request, response, next);
  }
}
