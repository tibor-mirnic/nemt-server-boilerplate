import { join } from 'path';
import { IEnvironment } from './../../core/models/environment';

export const local: IEnvironment = {
  name: 'local',
  superAdmin: {
    email: 'mirnictibor@gmail.com',
    firstName: 'Tibor',
    lastName: 'Mirnic',
    password: 'boilerplate'
  },
  https: {
    host: '127.0.0.0.1',
    port: 8043
  },
  mongoDb: {
    url: '127.0.0.1:27017',
    databaseName: 'boilerplate_local',
    user: 'local',
    password: 'local'
  },
  corsRegex: '.*',
  baseUrl: 'https://localhost:4202',
  keys: {
    key: join(__dirname, '../keys/key.pem'),
    cert: join(__dirname, '../keys/cert.pem'),
    passphrase: 'boilerplate'
  },
  googleConfiguration: {
    clientId: 'some id'
  }
};