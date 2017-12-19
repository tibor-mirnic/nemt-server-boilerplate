import { Connection } from 'mongoose';

import { RoleFactory } from './models/role/factory';
import { UserFactory } from './models/user/factory';
import { TokenFactory } from './models/token/factory';
import { AuditLogFactory } from './models/audit-log/factory';

export interface IFactories {
  auditLog: AuditLogFactory;
  role: RoleFactory;
  user: UserFactory;
  token: TokenFactory;
}

export class FactoryBuilder {
  static build(connection: Connection): IFactories {
    return {
      auditLog: new AuditLogFactory(connection),  
      role: new RoleFactory(connection),
      user: new UserFactory(connection),
      token: new TokenFactory(connection)
    };
  }
}