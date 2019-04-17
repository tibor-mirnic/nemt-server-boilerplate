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
        $group: {
          _id: '$_id',
          'role': { '$first': '$role' },
          'status': { '$first': '$status' },
          'email': { '$first': '$email' },
          'passwordHash': { '$first': '$passwordHash' },
          'firstName': { '$first': '$firstName' },
          'lastName': { '$first': '$lastName' },
          'isAdmin': { '$first': '$isAdmin' }
        },
        $project: {
          'email': 1,
          'passwordHash': 1,
          'firstName': 1,
          'lastName': 1,
        }
      },
      auditLogger: server.auditLogger
    });
  }
}
