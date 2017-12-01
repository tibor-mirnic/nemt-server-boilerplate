import { NextFunction } from 'express';

import { Router } from './../../core/express/router';
import { Server } from './../../core/server';
import { IRequest } from './../../core/models/express/request';
import { IResponse } from './../../core/models/express/response';
import { UserRepository } from './../../repositories/user';

export class UserRouter extends Router {
  
  constructor(server: Server) {
    super(server);
  }

  initRoutes() {
    this.router.route('/')
      .get(this.server.passport.bearer.bind(this.server.passport), this.queryAll.bind(this));
  }

  async queryAll(request: IRequest, response: IResponse, next: NextFunction) {
    try {
      let ur = new UserRepository(this.server, this.getUserId(request));
      let users = await ur.query();
      response.data = ur.transformObjects(users);
      return next();
    }
    catch(error) {
      next(error);
    }
  }
}