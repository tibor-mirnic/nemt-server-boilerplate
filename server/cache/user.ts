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

  async get(id: string): Promise<IUser> {    
    try {
      let user = cache.get(id);
      
      if(!user) {
        let dbUser = await this.repository.getById(id);
        user = this.repository.transformObject(dbUser);
        cache.set(id, user);
      }
      
      return user;
    }
    catch(error) {
      throw error;
    }
  }

  invalidate() {
    cache.reset();
  }
}