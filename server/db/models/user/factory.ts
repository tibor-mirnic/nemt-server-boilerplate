import { Connection } from 'mongoose';

import { Factory } from '../../../core/db/factory';
import { UserSchema } from './schema';
import { IUser } from './user';

export class UserFactory extends Factory<IUser> {
  constructor(connection: Connection) {
    super({
      connection: connection,
      name: 'User',
      definition: UserSchema,
      indexes: [{
        fields: {
          'email': 1,
          'deletedAt': 1
        },
        options: {
          'unique': true
        }
      }]
    });
  }
}
