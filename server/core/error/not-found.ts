import { ErrorBase } from './base';

export class NotFoundError extends ErrorBase {
  constructor(message = 'Required resource is not found.', name = 'Not Found') {
    super(message, name);
  }
}