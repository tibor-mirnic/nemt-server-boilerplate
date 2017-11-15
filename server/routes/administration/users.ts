import { NextFunction } from 'express';

import { Router } from './../../core/express/router';
import { Server } from './../../core/server';
import { IRequest } from './../../core/models/express/request';
import { IResponse } from './../../core/models/express/response';

export class UserRouter extends Router {
  
  constructor(server: Server) {
    super(server);
  }

  initRoutes() {
    this.router.route('/')
      .get(this.server.passport.bearerInternal.bind(this.server.passport), this.queryAll.bind(this));
  }

  async queryAll(request: IRequest, response: IResponse, next: NextFunction) {
    try {

    }
    catch(error) {
      next(error);
    }
  }
}