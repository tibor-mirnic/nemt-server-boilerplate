import * as LRU from 'lru-cache';

import { Server } from './../core/server';
import { UserFriendlyError } from './../core/error/user-friendly';
import { IUser } from './../db/models/user/user';
import { UserProvider } from './../providers/user';

let cache: LRU.Cache<string, IUser> = LRU({
  max: 1000000
});

export class UserCache {
  provider: UserProvider;

  constructor(server: Server) {    
    this.provider = new UserProvider(server, server.systemUserId);
  }

  async get(id: string) {
    let user;
    try {
      if(!id) {
        throw new UserFriendlyError('Unknown user');
      }

      if(typeof(id) === 'object') {
        id = (<any>id).toString();
      }

      user = cache.get(id);
      
      if(!user) {
        let dbUser = await this.provider.getById(id, 'role');
        user = this.provider.transformObject(dbUser);
        cache.set(id, user);
      }      
    }
    catch(error) {
      user = null;
    }

    return user;
  }

  invalidate() {
    cache.reset();
  }
}