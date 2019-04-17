import { IIdentifier } from '../../../core/models/db/identifier';

export interface IToken extends IIdentifier {
  user: string;
  data: any;
  token: string;
  type: string;
  expireAt: Date;
}
