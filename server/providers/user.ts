import { Server } from './../core/server';
import { Provider } from './../core/provider';
import { IUser } from './../db/models/user/user';

export class UserProvider extends Provider<IUser> {

  constructor(server: Server, userId: string) {
    super(server.models.users, userId, server.logger);
  }
}