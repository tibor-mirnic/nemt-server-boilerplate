import { Request } from 'express';

import { IUser } from '../../../db/models/user/user';

export interface IRequest extends Request {
  user?: IUser;
  token?: string;
}
