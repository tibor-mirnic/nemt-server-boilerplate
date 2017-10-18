import { Request } from 'express';
import { IUserBase } from './../../db/models/user-base';

export interface IRequest extends Request {
  user?: IUserBase;
  token?: string;
}