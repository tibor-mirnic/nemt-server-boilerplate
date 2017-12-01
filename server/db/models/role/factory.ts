import { Connection } from 'mongoose';
import { Factory } from './../../../core/db/factory';

import { RoleSchema } from './schema';
import { IRole } from './role';

export class RoleFactory extends Factory<IRole> {
  constructor(connection: Connection) {
    super({
      connection: connection,
      name: 'role',
      definition: RoleSchema,
      indexes: [{
        fields: {
          'type': 1
        },
        options: {
          'unique': true
        }
      }, {
        fields: {
          'createdAt': 1
        }
      }, {
        fields: {
          'updatedAt': 1
        }
      }]
    });    
  }
}
