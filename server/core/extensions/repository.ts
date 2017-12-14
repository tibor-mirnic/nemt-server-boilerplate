import { Factory } from './../db/factory';

export interface IRepositoryConfiguration<E> {
	factory: Factory<E>;
	userId?: string;
	aggregationQuery: IAggregationQuery;
	processDocument?: (record: E) => void;
}

export interface IAggregationQuery {
	arrayUnwind?: string[]; // use when you have array of references in your schema
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
	group?: {
		'_id': string;
		[other: string]: any
	};
	project?: {
		[other: string]: 0 | 1 | string | any
	};
}

export const transformAggregationQuery = (aggregated: IAggregationQuery, skipAndLimit = true): any[] => {
	let query: any[] = [];

	if(aggregated.arrayUnwind) {
		aggregated.arrayUnwind.forEach(path => {
			query.push({
				'$unwind': {
					'path': path,
					'preserveNullAndEmptyArrays': true
				}
			});
		});
	}

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

	if(aggregated.group) {		
		// if agggregation exist you can only use either inclusion on exclusion of the fields
		// by default we exclude __v property
		if(aggregated.project) {
			delete aggregated.project['__v'];
		}

		query.push({
			'$group': aggregated.group
		});
	}

	if(aggregated.sort) {
		query.push({
			'$sort': aggregated.sort
		});
	}

	if(skipAndLimit) {
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

	if(aggregated.project) {		
		query.push({
			'$project': aggregated.project
		});
	}

	return query;
}