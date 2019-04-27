import { NextFunction } from 'express';
import { Types } from 'mongoose';

import { Router } from '../../core/express/router';
import { Server } from '../../core/server';
import { IRequest } from '../../core/models/express/request';
import { IResponse } from '../../core/models/express/response';
import { UserRepository } from '../../repositories/user';
import { BadRequestError } from '../../core/error/user-friendly';
import { Passport } from '../../core/auth/passport';

export class UserRouter extends Router {

  constructor(server: Server) {
    super(server);
  }

  initRoutes() {
    this.router.route('/')
      .get(Passport.bearer, this.queryAll.bind(this));

    this.router.route('/:id')
      .get(Passport.bearer, this.findById.bind(this));
  }

  async queryAll(request: IRequest, response: IResponse, next: NextFunction) {
    try {
      const userId = this.getUserId(request);
      const ur = new UserRepository(this.server, userId);

      response.data = await ur.query();
      next();
    } catch (error) {
      next(Router.handleError(error, request, response));
    }
  }

  async findById(request: IRequest, response: IResponse, next: NextFunction) {
    try {
      const userId = this.getUserId(request);
      const ur = new UserRepository(this.server, userId);
      const id = request.params.id;

      if (!id) {
        throw new BadRequestError('A user ID is required.');
      }

      response.data = await ur.getOne({
        '_id': Types.ObjectId(id)
      });
      next();
    } catch (error) {
      next(Router.handleError(error, request, response));
    }
  }
}
