import { IIdentifier } from '../../../core/models/db/identifier';
import { IAuditInfo, ISoftDelete } from '../../../core/models/db/audit-info';
import { IPermission } from './permission';

export interface IRole extends IIdentifier, ISoftDelete, IAuditInfo {
  type: string;
  description: string;

  permissions: IPermission[];
}
