import { IEnvironment } from './models/environment';
import { local } from '../config/environments/local';
import { development } from '../config/environments/development';

export type EnvironmentType = 'local' | 'development';

export class Environment {
  static load(): IEnvironment {
    let env: EnvironmentType = <EnvironmentType>process.env.NODE_ENV || 'local';

    switch (env) {
      case 'local': {
        return local;
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
