import { Connection } from 'mongoose';
import { Factory } from './../../../core/db/factory';

import { TokenSchema } from './schema';
import { IToken } from './token';

export class TokenFactory extends Factory<IToken> {
  constructor(connection: Connection) {
    super({
      connection: connection,
      name: 'Token',
      definition: TokenSchema,
      indexes: [{
        fields: {
          'token': 1
        },
        options: {
          'unique': true
        }
      }, {
        fields: {
          'type': 1
        }
      }, {
        fields: {
          'user': 1
        }
      }, {
        fields: {
          expireAt: 1
        },
        options: {
          expireAfterSeconds: 1
        }
      }]
    });    
  }
}
