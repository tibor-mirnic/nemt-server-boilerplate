import { Server } from './../server';
import { NotImplementedError } from './../error/user-friendly';

export class RoutingModule {
  
  server: Server;
  baseUrl: string;

  constructor(server: Server, baseUrl: string) {  
    this.server = server;
    this.baseUrl = baseUrl;
  }
  
  build() {
    throw new NotImplementedError();
  }
}