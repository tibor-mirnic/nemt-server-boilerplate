import * as passport from 'passport';
import { NextFunction } from 'express';
import { Document } from 'mongoose';

import { Server } from './../server';
import { IRequest } from './../models/express/request';
import { IResponse } from './../models/express/response';
import { IPassportInfo } from './../models/passport';
import { ForbiddenError } from './../error/forbidden';

import { IUser } from './../../db/models/user/user';

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
      (error: any, user: Document & IUser, info: IPassportInfo) => {
        if (error) {
          return next(error);
        }
        
        request.user = user;
        return next();
      }
    )(request, response, next);
  }

  bearer(request: IRequest, response: IResponse, next: NextFunction) {
    passport.authenticate('bearer', { session: false },
      (error: any, user: Document & IUser, info: IPassportInfo) => {
        if (error) {
          return next(error);
        }

        if(!user) {
          return next(new ForbiddenError('Unauthorized!'));
        }

        request.user = user;

        if(info && info.token) {
          request.token = info.token;
        }

        return next();
      }
    )(request, response, next);
  }

  bearerInvite(request: IRequest, response: IResponse, next: NextFunction) {
    passport.authenticate('bearer-invite', { session: false },
      (error: any, user: Document & IUser, info: IPassportInfo) => {
        if (error) {
          return next(error);
        }

        if(!user) {
          return next(new ForbiddenError('Unauthorized!'));
        }

        request.user = user;

        if(info && info.token) {
          request.token = info.token;
        }

        return next();
      }
    )(request, response, next);    
  }

  bearerOnboard(request: IRequest, response: IResponse, next: NextFunction) {
    passport.authenticate('bearer-onboard', { session: false },
      (error: any, token: string) => {
        if (error) {
          return next(error);
        }

        if(!token) {
          return next(new ForbiddenError('Unauthorized!'));
        }

        request.token = token;        

        return next();
      }
    )(request, response, next);    
  }

  localInternal(request: IRequest, response: IResponse, next: NextFunction) {
    passport.authenticate('local-internal', { session: false },
      (error: any, user: Document & IUser) => {
        if (error) {
          return next(error);
        }
        
        request.user = user;
        return next();
      }
    )(request, response, next);
  }

  bearerInternal(request: IRequest, response: IResponse, next: NextFunction) {
    passport.authenticate('bearer-internal', { session: false },
      (error: any, user: Document & IUser, info: IPassportInfo) => {
        if (error) {
          return next(error);
        }

        if(!user) {
          return next(new ForbiddenError('Unauthorized!'));
        }

        request.user = user;

        if(info && info.token) {
          request.token = info.token;
        }

        return next();
      }
    )(request, response, next);
  }
}