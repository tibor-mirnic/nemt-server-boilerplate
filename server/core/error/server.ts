import { ErrorBase } from './base';

export class ServerError extends ErrorBase {
  constructor(message = 'Code execution failed!', name = 'Server') {
    super(message, name);
  }
}

export class DatabaseError extends ServerError {
  constructor(message = 'Database error thrown!', name = 'Database Error') {
    super(message, name);
  }
}

export class InternalServerError extends ServerError {
  constructor(message = 'Internal server error thrown!', name = 'Internal Server Error') {
    super(message, name);
  }
}

export class MissingArgumentsError extends ServerError {
  constructor(message = 'Missing arguments!') {
    super(message, 'Missing Arguments');
  }
}