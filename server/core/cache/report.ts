import * as LRU from 'lru-cache';
import { v4 } from 'uuid';
import { IReport } from './../models/reports/report';
import { UserFriendlyError } from './../error/user-friendly';

let cache: LRU.Cache<string, IReport> = LRU({
  max: 1000
});

export class ReportCache {
  
  static save(report: IReport) {
    let id = v4();
    report.id = id;
    cache.set(id, report);
    return id;
  }

  static get(reportId: string): IReport {
    let report: IReport | undefined = cache.get(reportId);

    if(!report) {
      throw new UserFriendlyError('Report not found!');
    }

    return report;
  }

  static invalidate() {
    cache.reset();
  }
}