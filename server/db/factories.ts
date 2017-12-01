import { Connection } from 'mongoose';

import { RoleFactory } from './models/role/factory';
import { UserFactory } from './models/user/factory';
import { TokenFactory } from './models/token/factory';

export interface IFactories {
    roles: RoleFactory;
    users: UserFactory;
    token: TokenFactory;
}

export class FactoryBuilder {
  static build(connection: Connection): IFactories {
    return {      
      roles: new RoleFactory(connection),
      users: new UserFactory(connection),
      token: new TokenFactory(connection)
    }
  }
}