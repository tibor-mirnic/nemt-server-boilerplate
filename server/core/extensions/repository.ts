import { Factory } from '../db/factory';
import { IAuditLogger } from '../models/audit-log';

export interface IRepositoryConfiguration<E> {
  factory: Factory<E>;
  userId: string;
  aggregationQuery: IAggregationQuery;

  auditLogger: IAuditLogger;
}

export interface ILookupQuery {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
}

export interface IProjectQuery {
  [project: string]: 0 | 1 | string | any;
}

export interface IAggregationQuery {
  unwindFirst?: string[]; // use when you need to unwind before lookup
  $lookup?: ILookupQuery[];
  $match?: {
    [other: string]: any
  };
  $sort?: {
    [other: string]: -1 | 1
  };
  $skip?: number;
  $limit?: number;
  $unwind?: string[];
  $group?: {
    _id: string;
    [other: string]: any
  };
  $project?: IProjectQuery | IProjectQuery[];
}

export const transformAggregationQuery = (aggregated: IAggregationQuery, includeSkipAndLimit = true): any[] => {
  const query: any[] = [];

  if (aggregated.unwindFirst) {
    aggregated.unwindFirst.forEach(path => {
      query.push({
        $unwind: {
          'path': path,
          'preserveNullAndEmptyArrays': true
        }
      });
    });
  }

  if (aggregated.$lookup) {
    aggregated.$lookup.forEach(lookup => {
      query.push({
        $lookup: lookup
      });
    });
  }

  if (aggregated.$match) {
    query.push({
      $match: aggregated.$match
    });
  }

  if (aggregated.$unwind) {
    aggregated.$unwind.forEach(path => {
      query.push({
        $unwind: {
          'path': path,
          'preserveNullAndEmptyArrays': true
        }
      });
    });
  }

  if (aggregated.$group) {
    query.push({
      $group: aggregated.$group
    });
  }

  if (aggregated.$sort) {
    query.push({
      $sort: aggregated.$sort
    });
  }

  if (includeSkipAndLimit) {
    if (aggregated.$skip) {
      query.push({
        $skip: aggregated.$skip
      });
    }

    if (aggregated.$limit) {
      query.push({
        $limit: aggregated.$limit
      });
    }
  }

  if (aggregated.$project) {
    if (Array.isArray(aggregated.$project)) {
      aggregated.$project.forEach(project => {
        query.push({
          $project: project
        });
      });
    } else {
      query.push({
        $project: aggregated.$project
      });
    }
  }

  return query;
};
