import * as LRU from 'lru-cache';

import { Server } from './../core/server';
import { UserFriendlyError } from './../core/error/user-friendly';
import { IUser } from './../db/models/user/user';
import { UserRepository } from './../repositories/user';

let cache: LRU.Cache<string, IUser> = LRU({
  max: 1000000
});

export class UserCache {
  repository: UserRepository;

  constructor(server: Server) {    
    this.repository = new UserRepository(server, server.systemUserId);
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
        let dbUser = await this.repository.getById(id);
        user = this.repository.transformObject(dbUser);
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