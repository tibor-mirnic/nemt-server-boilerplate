import { Server } from './../../core/server';

import { UserRepository } from './../../repositories/user';

export class FactoryTest {
	private server: Server;
	private userRepo: UserRepository;

	constructor(server: Server) {
		this.server = server;
		this.userRepo = new UserRepository(this.server, server.systemUserId);
	}

	async loadUsersWithRole() {
		try {			
			let users = await this.userRepo.query({
				$sort: {
					'role.type': 1
				},
				
			});

			if(!users.length) {
				throw 'fixture: loadUsersWithRole - FAILED';
			}			
		}
		catch(error) {
			throw error;
		}
	}

	async overrideDefaultQuery() {
		try {			
			let users = await this.userRepo.query({
				$match: {
					'isDeleted': { '$in': [ true, false ] },
					'isSystem': { '$in': [ true, false ] }
				},
				$sort: {
					'role.type': -1
				}
			});

			if(!users.length) {
				throw 'fixture: overrideDefaultQuery - FAILED';
			}			
		}
		catch(error) {
			throw error;
		}
	}

	async findSuperUserWithRole() {
		try {
			let superAdminWithRole = await this.userRepo.findOne({
				'isAdmin': true
			});

			if(!superAdminWithRole) {
				throw 'fixture: findSuperUserWithRole - FAILED';
			}
		}
		catch(error) {
			throw error;
		}
	}
}