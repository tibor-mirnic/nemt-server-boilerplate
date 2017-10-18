process.env.NODE_ENV="test";

import { execSync } from 'child_process';

import { Server } from './../../core/server';
import { UserProvider } from './../../providers/user';
import { RoleProvider } from './../../providers/role';

import { UserFriendlyError } from './../../core/error/user-friendly';

console.log('Create test user for boilerplate_test database:\r\n');
execSync("mongo boilerplate_test --eval \"db.dropUser('test')\"", { stdio:[0,1,2] });
execSync('mongo boilerplate_test --eval "db.createUser({ user: \'test\', pwd: \'test\', roles: [{ role: \'readWrite\', db: \'boilerplate_test\'}]})"', { stdio:[0,1,2] });

let run = async () => {
  try {
    let server = await Server.bootstrap();
    let rp = new RoleProvider(server, server.systemUserId);
    let up = new UserProvider(server, server.systemUserId);

    let dbRole = await rp.findOne({
      type: 'SUPER_ADMIN'
    });
    
    if(!dbRole) {
      throw 'Super admin role does not exits';
    }

    let dbUser = await up.findOne({
      'isAdmin': true
    });

    if(!dbUser) {
      throw 'Super admin user does not exits';
    }

    let roles = await rp.query();
    // let excluded = rp.transformObjects(roles, ['isDeleted', 'type']);
    let excluded = rp.transformObjects(roles);

    console.log(excluded.length);

    await rp.delete(dbRole._id.toString(), async (role) => {
      let dbUsers = await up.query({
        'role': role._id.toString()
      });

      if(Array.isArray(dbUsers) && dbUsers.length > 0) {
        throw new UserFriendlyError('You cannot delete a role which has users!', 'Role');
      }

      return true;
    });
  }
  catch(error) {
    console.log(error);
  }
};

run();