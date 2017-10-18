import { Router as ExpressRouter } from 'express';

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
}