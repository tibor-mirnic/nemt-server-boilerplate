import { Connection } from 'mongoose';

import { RoleFactory } from './models/role/factory';
import { UserFactory } from './models/user/factory';
import { TokenFactory } from './models/token/factory';

export interface IFactories {
    role: RoleFactory;
    user: UserFactory;
    token: TokenFactory;
}

export class FactoryBuilder {
  static build(connection: Connection): IFactories {
    return {      
      role: new RoleFactory(connection),
      user: new UserFactory(connection),
      token: new TokenFactory(connection)
    };
  }
}