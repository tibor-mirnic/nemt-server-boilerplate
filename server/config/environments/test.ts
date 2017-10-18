import { join } from 'path';
import { IEnvironment } from './../../core/models/environment';

export const test: IEnvironment = {
  name: 'test',
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
    databaseName: 'boilerplate_test',
    user: 'test',
    password: 'test'
  },
  corsRegex: '.*',
  baseUrl: 'https://localhost:4202',
  keys: {
    key: join(__dirname, '../keys/private.key'),
    cert: join(__dirname, '../keys/certificate.pem')
  },
  googleConfiguration: {
    clientId: 'some id'
  }
};