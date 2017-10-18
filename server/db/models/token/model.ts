import { Connection } from 'mongoose';
import { ModelBase } from './../../../core/db/model';

import { TokenSchema } from './schema';
import { IToken } from './token';

export class TokenModel extends ModelBase<IToken> {
  constructor(dbConnection: Connection) {
    super(dbConnection, 'Token', TokenSchema);

    this.indexes = [
      [{ token: 1 }, { unique: true }],
      [{ type: 1 }],
      [{ user: 1 }],
      [{ expireAt: 1 }, { expireAfterSeconds: 1 }] // Mongodb will remove expired token automatically
    ];
  }
}
