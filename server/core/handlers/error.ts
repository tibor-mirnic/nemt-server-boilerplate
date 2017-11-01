import { NextFunction } from 'express';

import { AuthenticationError } from './../error/auth';
import { ServerError, InternalServerError } from './../error/server';
import { ForbiddenError } from './../error/forbidden';
import { UserFriendlyError } from './../error/user-friendly';
import { NotFoundError } from './../error/not-found';
import { IRequest } from './../models/express/request';
import { IResponse } from './../models/express/response';

export class ErrorHandler {
  static process(error: any, request: IRequest, response: IResponse, next: NextFunction) {
    if (error instanceof AuthenticationError) {
      response.status(401).send(error.toJSON());
    }
    else if (error instanceof ForbiddenError) {
      response.status(403).send(error.toJSON());
    }
    else if (error instanceof UserFriendlyError) {
      response.status(400).send(error.toJSON());
    }
    else if (error instanceof NotFoundError) {
      response.status(404).send(error.toJSON());
    }
    else if (error instanceof ServerError) {
      response.status(500).send(error.toJSON());
    }
    else {
      // for the errors that occure in the middleware
      error = error instanceof Error ? {
        name: error.name,
        message: error.stack || error.message
      } : {
        name: 'Unknown',
        message: error.toString()
      };

      response.status(500).send(new InternalServerError(error.message, error.name));
    }
  }
}