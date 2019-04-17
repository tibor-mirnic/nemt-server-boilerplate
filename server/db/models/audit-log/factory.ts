import { Connection } from 'mongoose';

import { Factory } from '../../../core/db/factory';
import { AuditLogSchema } from './schema';
import { IAuditLog } from './audit-log';

export class AuditLogFactory extends Factory<IAuditLog> {
  constructor(connection: Connection) {
    super({
      connection: connection,
      name: 'AuditLog',
      definition: AuditLogSchema,
      indexes: [{
        fields: {
          'collectionName': 1
        }
      }, {
        fields: {
          'entityId': 1
        }
      }, {
        fields: {
          'userId': 1
        }
      }, {
        fields: {
          'operation': 1
        }
      }, {
        fields: {
          'createdAt': 1
        }
      }]
    });
  }
}
