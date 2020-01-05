import { Server } from '../server';
import { NotImplementedError } from '../error/user-friendly';

export class RoutingModule {

  constructor(public server: Server, public baseUrl: string) {
  }

  build() {
    throw new NotImplementedError();
  }
}
