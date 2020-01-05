import { IPermission } from '../models/role/permission';

export const permissions: IPermission[] = [
  { type: 'USER_READ', description: 'View users' },
  { type: 'USER_WRITE', description: 'Create or update users' }
];
