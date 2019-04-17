import { Server } from '../core/server';
import { Repository } from '../core/repository';
import { IToken } from '../db/models/token/token';

export class TokenRepository extends Repository<IToken> {

  constructor(server: Server) {
    super({
      factory: server.factories.token,
      userId: server.systemUserId,
      aggregationQuery: {},
      auditLogger: server.auditLogger
    });
  }
}
