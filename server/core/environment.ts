import { IEnvironment } from './models/environment';
import { local } from './../config/environments/local';
import { test } from './../config/environments/test';
import { development } from './../config/environments/development';

export type EnvironmentType = 'local' | 'test' | 'development';

export class Environment {
  static load(): IEnvironment {
    let env: EnvironmentType = <EnvironmentType>process.env.NODE_ENV || 'local';
    
    switch(env) {
      case 'local': {
        return local;
      }
      case 'test': {
        return test;
      }
      case 'development': {
        return development;
      }
      default: {
        return local;
      }
    }
  }
}