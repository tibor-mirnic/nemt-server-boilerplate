process.env.NODE_ENV="test";

import { execSync } from 'child_process';

import { Server } from './../../core/server';
import { FactoryTest } from './factory';

console.log('Create test user for boilerplate_test database:\r\n');
execSync("mongo boilerplate_test --eval \"db.dropUser('test')\"", { stdio:[0,1,2] });
execSync('mongo boilerplate_test --eval "db.createUser({ user: \'test\', pwd: \'test\', roles: [{ role: \'readWrite\', db: \'boilerplate_test\'}]})"', { stdio:[0,1,2] });

let run = async () => {
  try {
    let server = await Server.bootstrap();
    let facTest = new FactoryTest(server);
    
    await facTest.loadUsersWithRole();
    await facTest.overrideDefaultQuery();
    await facTest.findSuperUserWithRole();

    console.log('All tests passed');
  }
  catch(error) {
    console.log(error);
    process.exit();
  }
};

run();