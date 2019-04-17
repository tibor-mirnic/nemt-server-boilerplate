import * as LRU from 'lru-cache';
import { Util } from '../util/util';
import { UserFriendlyError } from '../error/user-friendly';

let cache: LRU.Cache<string, string> = LRU({
  max: 1000
});

export class TokenCache {

  static save() {
    let id = Util.generateToken();
    cache.set(id, id);
    return id;
  }

  static get(token: string): string {
    let cached: string | undefined = cache.get(token);

    if (!cached) {
      throw new UserFriendlyError('Token not found!');
    }

    return cached;
  }

  static invalidate() {
    cache.reset();
  }
}
