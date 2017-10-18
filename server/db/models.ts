import { Model, Document, Connection } from 'mongoose';

import { IToken } from './models/token/token';
import { TokenModel } from './models/token/model';

import { IRole } from './models/role/role';
import { RoleModel } from './models/role/model';

import { IUser } from './models/user/user';
import { UserModel } from './models/user/model';

export interface IModels {
  token: Model<Document & IToken>;
  roles: Model<Document & IRole>;
  users: Model<Document & IUser>;
}

export class ModelBuilder {
  static build(dbConnection: Connection): IModels {
    return {
      token: new TokenModel(dbConnection).build(),
      roles: new RoleModel(dbConnection).build(),
      users: new UserModel(dbConnection).build()
    }
  }
}