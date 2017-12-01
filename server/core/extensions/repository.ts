import { Factory } from './../db/factory';

export interface IRepositoryConfiguration<E> {
	factory: Factory<E>;
	userId?: string;
	aggregationQuery: IAggregationQuery;
	processDocument?: (record: E) => void;
}

export interface IAggregationQuery {
	lookup?: [{
		from: string;
		localField: string;
		foreignField: string;
		as: string;
	}];
	match?: {
		[other: string]: any
	};
	sort?: {
		[other: string]: -1 | 1
	};
	skip?: number;
	limit?: number;
	unwind?: string[];
	project?: {
		[other: string]: 0 | 1
	};
}

export const transformAggregationQuery = (aggregated: IAggregationQuery, sortAndLimit = true): any[] => {
	let query: any[] = [];

 	if(aggregated.lookup) {
		aggregated.lookup.forEach(lookup => {
			query.push({
				'$lookup': lookup
			});
		});
	}

	if(aggregated.match) {
		query.push({
			'$match': aggregated.match
		});
	}

	if(sortAndLimit) {
		if(aggregated.sort) {
			query.push({
				'$sort': aggregated.sort
			});
		}
	
		if(aggregated.skip) {
			query.push({
				'$skip': aggregated.skip
			});
		}
	
		if(aggregated.limit) {
			query.push({
				'$limit': aggregated.limit
			});
		}
	}
	
	if(aggregated.unwind) {
		aggregated.unwind.forEach(path => {
			query.push({
				'$unwind': {
					'path': path,
					'preserveNullAndEmptyArrays': true
				}
			});
		});
	}

	if(aggregated.project) {
		query.push({
			'$project': aggregated.project
		});
	}

	return query;
}