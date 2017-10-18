import { Server } from './../core/server';
import { Provider } from './../core/provider';
import { IRole } from './../db/models/role/role';

export class RoleProvider extends Provider<IRole> {

  constructor(server: Server, userId: string) {
    super(server.models.roles, userId, server.logger);
  }
}