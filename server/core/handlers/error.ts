import { NextFunction } from 'express';

import { AuthenticationError } from '../error/auth';
import { InternalServerError, ServerError } from '../error/server';
import { ForbiddenError } from '../error/forbidden';
import { UserFriendlyError } from '../error/user-friendly';
import { NotFoundError } from '../error/not-found';
import { IRequest } from '../models/express/request';
import { IResponse } from '../models/express/response';
import { Logger } from '../logger';

export class ErrorHandler {

  static process(error: any, request: IRequest, response: IResponse, next: NextFunction) {
    const defaultErrorMessage = 'Oops, there was an error!';
    let isUserFriendly = false;
    let statusCode = 500;

    if (error instanceof AuthenticationError) {
      statusCode = 401;
      error = error.toJSON();
    } else if (error instanceof ForbiddenError) {
      statusCode = 403;
      error = error.toJSON();
    } else if (error instanceof UserFriendlyError) {
      isUserFriendly = true;
      statusCode = 400;
      error = error.toJSON();
    } else if (error instanceof NotFoundError) {
      statusCode = 404;
      error = error.toJSON();
    } else if (error instanceof ServerError) {
      error = error.toJSON();
    } else if (error instanceof Error) {
      error = new InternalServerError(error.message || defaultErrorMessage);
    } else if (typeof error === 'string') {
      error = new InternalServerError(error);
    } else {
      error = new InternalServerError(defaultErrorMessage);
    }

    response.status(statusCode).send(error);

    // log error
    if (!isUserFriendly) {
      Logger.logRequest(error, response);
    }
  }
}
