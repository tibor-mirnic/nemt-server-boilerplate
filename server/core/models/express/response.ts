import { Response } from 'express';

export interface IResponse extends Response {
  emptyResponse?: boolean;
  data?: any;
  onErrorRequestData?: {
    userIdentifier?: string;
    url: string;
    params?: any;
    body?: any;
  };
}
