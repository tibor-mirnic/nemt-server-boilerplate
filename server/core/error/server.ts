import { ErrorBase } from './base';

export class ServerError extends ErrorBase {
  constructor(message = 'Code execution failed!', name = 'Server') {
    super(message, name);
  }
}

export class DatabaseError extends ServerError {
  constructor(message = 'Database error thrown!') {
    super(message, 'Database Error');
  }
}

export class InternalServerError extends ServerError {
  constructor(message = 'Internal server error thrown!') {
    super(message, 'Internal Server Error');
  }
}

export class MissingArgumentsError extends ServerError {
  constructor(message = 'Missing arguments!') {
    super(message, 'Missing Arguments');
  }
}
