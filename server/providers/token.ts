import { Server } from './../core/server';
import { Provider } from './../core/provider';
import { IToken } from './../db/models/token/token';

export class TokenProvider extends Provider<IToken> {

  constructor(server: Server) {
    super(server.models.token, null);
  }
}