import { Server } from '../core/server';
import { Repository } from '../core/repository';
import { IUser } from '../db/models/user/user';

export class StrategiesRepository extends Repository<IUser> {

  constructor(server: Server) {
    super({
      factory: server.factories.user,
      userId: server.systemUserId,
      aggregationQuery: {
        $lookup: [{
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role'
        }],
        $match: {
          'isDeleted': false,
          'isSystem': false,
          'status': 'active'
        },
        $unwind: ['$role'],
        $project: {
          'isAdmin': 1,
          'email': 1,
          'passwordHash': 1,
          'firstName': 1,
          'lastName': 1,
          'role': {
            'type': 1,
            'description': 1,
            'permissions': 1
          }
        }
      },
      auditLogger: server.auditLogger
    });
  }
}
