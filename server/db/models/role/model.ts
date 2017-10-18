import { Connection } from 'mongoose';
import { ModelBase } from './../../../core/db/model';

import { RoleSchema } from './schema';
import { IRole } from './role';

export class RoleModel extends ModelBase<IRole> {
  constructor(dbConnection: Connection) {
    super(dbConnection, 'Role', RoleSchema);

    this.indexes = [
      [{ type: 1 }, { unique: true }],
      [{ createdAt: 1 }],
      [{ updatedAt: 1}]
    ];
  }
}
