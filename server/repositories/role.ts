import { Server } from '../core/server';
import { Repository } from '../core/repository';
import { IRole } from '../db/models/role/role';

export class RoleRepository extends Repository<IRole> {

  constructor(server: Server, userId: string) {
    super({
      factory: server.factories.role,
      userId: userId,
      aggregationQuery: {
        $match: {
          'isDeleted': false
        },
        $project: {
          'type': 1,
          'description': 1,
          'permissions': 1
        }
      },
      auditLogger: server.auditLogger
    });
  }
}
