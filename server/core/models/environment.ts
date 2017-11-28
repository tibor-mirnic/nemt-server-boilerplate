export interface ISuperAdmin {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface IHttps {
  host: string;
  port: number;
}

export interface IMongoDb {
  url: string;
  databaseName: string;
  user: string;
  password: string;
}

export interface ICertificationKeys {
  key: string;
  cert: string;
  passphrase: string;
}

export interface IGoogleConfiguration {
  clientId: string;
}

export interface IEnvironment {
  name: string;
  
  superAdmin: ISuperAdmin;
  https: IHttps;
  mongoDb: IMongoDb;
  corsRegex: string;
  baseUrl: string;
  keys: ICertificationKeys;
  googleConfiguration: IGoogleConfiguration;
}