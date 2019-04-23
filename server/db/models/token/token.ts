import { IIdentifier } from '../../../core/models/db/identifier';
import { IAuditInfo, ISoftDelete } from '../../../core/models/db/audit-info';

export interface IToken extends IIdentifier, ISoftDelete, IAuditInfo {
  user: string;
  data: any;
  token: string;
  type: string;
  expireAt: Date;
}
