import { Server } from '../core/server';
import { Repository } from '../core/repository';
import { IUser } from '../db/models/user/user';

export class UserRepository extends Repository<IUser> {

  constructor(server: Server, userId: string) {
    super({
      factory: server.factories.user,
      userId: userId,
      aggregationQuery: {
        $lookup: [{
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role'
        }],
        $match: {
          'isDeleted': false,
          'isSystem': false
        },
        $unwind: ['$role'],
        $project: {
          'isAdmin': 1,
          'email': 1,
          'firstName': 1,
          'lastName': 1,
          'status': 1,
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
