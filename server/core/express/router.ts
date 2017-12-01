import { Router as ExpressRouter } from 'express';
import { IRequest } from './../../core/models/express/request';

import { Server } from './../server';
import { NotImplementedError } from './../error/user-friendly';

export class Router {
  server: Server;
  router: ExpressRouter;

  constructor(server: Server) {
    this.server = server;
    
    this.router = ExpressRouter();
  }

  initRoutes() {
    throw new NotImplementedError();
  }

  build(): ExpressRouter {
    this.initRoutes();

    return this.router;
  }

  getUserId(request: IRequest): string {
    let id = this.server.systemUserId;
    if(request.user) {
      id = request.user._id;
    }

    return id;
  }
}