import { Response } from 'express';

export interface IResponse extends Response {
  emptyResponse?: boolean;
  data?: any;
}