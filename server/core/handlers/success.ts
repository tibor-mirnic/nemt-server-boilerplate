import { NextFunction } from 'express';
import { NotFoundError } from '../error/not-found';
import { IRequest } from '../models/express/request';
import { IResponse } from '../models/express/response';

export class SuccessHandler {

  static process(request: IRequest, response: IResponse, next: NextFunction) {
    if (response.emptyResponse) {
      response.sendStatus(204); // Success with no body content.
    } else if (response.data) {
      response.status(200).json(response.data);
    } else {
      next(new NotFoundError('Route not found!'));
    }
  }
}
