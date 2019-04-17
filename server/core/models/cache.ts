import { ReportCache } from '../cache/report';
import { TokenCache } from '../cache/token';
import { UserCache } from '../../cache/user';

export interface ICache {
  token: TokenCache;
  report: ReportCache;

  // dbCache
  user: UserCache;
}
