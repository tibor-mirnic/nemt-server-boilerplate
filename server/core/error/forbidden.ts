import { ErrorBase } from './base';

export class ForbiddenError extends ErrorBase {
  constructor(message = 'You are not permitted to see this page!', name = 'Forbidden Error') {
    super(message, name);
  }
}
