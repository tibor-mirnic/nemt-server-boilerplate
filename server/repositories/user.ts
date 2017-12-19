import { Server } from './../core/server';
import { Repository } from './../core/repository';
import { IUser } from './../db/models/user/user';

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
          'passwordHash': 0          
        }
      },
      auditLogger: server.auditLogger
    });
  }
}