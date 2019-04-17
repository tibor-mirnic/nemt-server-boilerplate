import { IIdentifier } from '../../../core/models/db/identifier';
import { IAuditInfo, ISoftDelete } from '../../../core/models/db/audit-info';
import { IRole } from '../role/role';

export interface IUser extends IIdentifier, ISoftDelete, IAuditInfo {
  role?: IRole | null;

  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;

  isSystem: boolean;
  isAdmin: boolean;
}
