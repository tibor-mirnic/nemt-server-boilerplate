import { Connection } from 'mongoose';
import { ModelBase } from './../../../core/db/model';

import { UserSchema } from './schema';
import { IUser } from './user';

export class UserModel extends ModelBase<IUser> {
  constructor(dbConnection: Connection) {
    super(dbConnection, 'User', UserSchema);

    this.indexes = [
      [{ email: 1, deletedAt: 1 }, { unique: true }],      
      [{ createdAt: 1 }],
      [{ updatedAt: 1 }]
    ];

    this.deepPopulate = {
      populate: {
        'role': {
          match: { 'isDeleted': false },
          select: 'type permissions description isDeleted createdAt updatedAt deletedAt createdBy updatedBy deletedBy'
        }        
      }
    };
  }
}
