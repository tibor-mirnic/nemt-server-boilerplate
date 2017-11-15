import { NextFunction } from 'express';

import { Server } from './../server';
import { AuthenticationError } from './../error/auth';
import { ServerError, InternalServerError } from './../error/server';
import { ForbiddenError } from './../error/forbidden';
import { UserFriendlyError } from './../error/user-friendly';
import { NotFoundError } from './../error/not-found';
import { IRequest } from './../models/express/request';
import { IResponse } from './../models/express/response';

export class ErrorHandler {
  server: Server;
  defaultError: InternalServerError;

  constructor(server: Server) {
    this.server = server;

    this.defaultError = new InternalServerError('Oops, there was an error!');
  }
  
  process(error: any, request: IRequest, response: IResponse, next: NextFunction) {
    let isUserFriendly = false;
    
    if (error instanceof AuthenticationError) {
      response.status(401).send(error.toJSON());
    }
    else if (error instanceof ForbiddenError) {
      response.status(403).send(error.toJSON());
    }
    else if (error instanceof UserFriendlyError) {
      isUserFriendly = true;
      response.status(400).send(error.toJSON());
    }
    else if (error instanceof NotFoundError) {
      response.status(404).send(error.toJSON());
    }
    else if (error instanceof ServerError
      || error instanceof InternalServerError) {
      response.status(500).send(this.defaultError);
    }
    else if(error instanceof Error) {
      error = new InternalServerError(error.stack || error.message);
      response.status(500).send(this.defaultError);
    }
    else if(typeof(error) === 'string') {
      error = new InternalServerError(error);
      response.status(500).send(this.defaultError);
    }

    // log error
    if(!isUserFriendly) {
      this.server.logger.logRequest(error, request);
    }
  }
}