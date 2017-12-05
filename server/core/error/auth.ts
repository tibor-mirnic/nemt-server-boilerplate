import { ErrorBase } from './base';

export class AuthenticationError extends ErrorBase {
  constructor(message = 'Authentication failed', name = 'Authentication Error') {
    super(message, name);
  }
}

export class GoogleAuthenticationError extends AuthenticationError {
  constructor(message = 'Google Authentication Error') {
    super(message, 'Google Authentication');
  }
}