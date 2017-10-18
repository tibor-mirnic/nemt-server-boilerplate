import { ReportCache } from './../cache/report';
import { TokenCache } from './../cache/token';

import { UserCache } from './../../cache/user';

export interface ICache {
  tokenCache: TokenCache;
  reportCache: ReportCache;

  // dbCache
  userCache: UserCache;
}