import { ErrorBase } from './base';

export class UserFriendlyError extends ErrorBase {
  constructor(message = 'You have ana error', name = 'User Friendly') {
    super(message, name);
  }
}

export class BadRequestError extends UserFriendlyError {
  constructor(message = 'Bad Request. Please check your parameters!') {
    super(message, 'Bad Request Error');
  }
}

export class NotImplementedError extends UserFriendlyError {
  constructor(message = 'This feature is not implemented!') {
    super(message, 'Not Implemented');
  }
}

export class ValidationError extends UserFriendlyError {
  constructor(message = 'Validation failed') {
    super(message, 'Validation');
  }
}
