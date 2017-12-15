let fileStreamRotator = require('file-stream-rotator');
let busboy = require('connect-busboy');

import * as express from 'express';
import { Document } from 'mongoose';
import { join } from 'path';
import { createServer, ServerOptions } from 'https';
import { readFileSync } from 'fs-extra';

import * as cors from 'cors';
import * as helmet from 'helmet';
import * as connectSlashes from 'connect-slashes';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';

import { Logger } from './logger';
import { IEnvironment } from './models/environment';
import { Environment } from './environment';
import { IConstants } from './models/constants';
import { ICache } from './models/cache';
import { DbContext } from './db/db-context';
import { Passport } from './auth/passport';

import { FactoryBuilder, IFactories } from './../db/factories';

import { Util } from './util/util';

import { IRequest } from './../core/models/express/request';
import { IResponse } from './../core/models/express/response';
import { SuccessHandler } from './handlers/success';
import { ErrorHandler } from './handlers/error';

import { RoutesModule } from './../routes/module';

// db
import { permissions } from './../db/static/permissions';

// cache
import { UserCache } from './../cache/user';
import { ReportCache } from './../core/cache/report';
import { TokenCache } from './../core/cache/token';

// repositories
import { RoleRepository } from './../repositories/role';
import { IRole } from './../db/models/role/role';

import { UserRepository } from './../repositories/user';

export class Server {
  serverLogPath: string;
  environmentsPath: string;
  httpLogPath: string;
  exportPath: string;

  app: express.Application;

  logger: Logger;
  environment: IEnvironment;
  constants: IConstants;

  dbContext: DbContext;
  factories: IFactories;

  passport: Passport;

  systemUserId: string;

  cache: ICache;

  constructor() {
    this.initFolderPaths();
    
    this.app = express();
    this.logger = new Logger(this.serverLogPath);
    this.environment = Environment.load();

    this.dbContext = new DbContext(this.environment, this.logger);
    this.factories = FactoryBuilder.build(this.dbContext.getConnection());
    
    // build middleware
    this.useHeaders();
    this.useBodyParser();
    this.useBusboy();  
    this.useMorgan();
    
    this.checkConnection();
    
    this.usePassport();
    this.useRoutes();

    this.useHandlers();
  }

  initFolderPaths() {
    this.serverLogPath = join(__dirname, '../private', 'log', 'server');
    this.httpLogPath = join(__dirname, '../private', 'log', 'http');
    this.exportPath = join(__dirname, '../private', 'tmp', 'export');    
  }

  useHeaders() {
    let corsOptions = {
      origin: RegExp(this.environment.corsRegex),
      credentials: true
    };
    
    this.app.use(cors(corsOptions));
    this.app.use(helmet.frameguard());
    this.app.options('*', cors(corsOptions));

    this.app.use(connectSlashes(false));
  }

  useBodyParser() {
    this.app.use(bodyParser.urlencoded({
      'extended': true
    }));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.text({ 
      'type': 'text/plain' 
    }));
  }

  useBusboy() {  
    this.app.use(busboy({
      'limits': {
        'fileSize': 1 * 1024 * 1024
      }
    }));
  }

  useMorgan() {
    let accessLogStream = fileStreamRotator.getStream({
      'date_format' : 'YYYY-MM-DD',
      'filename': join(this.httpLogPath, '%DATE%.log'),
      'frequency': 'daily',
      'verbose': false
    });

    this.app.use(morgan(':date[iso] - :method :url :status :res[content-length] B - :response-time ms'));
    this.app.use(morgan(':date[iso] - :method :url :status :res[content-length] B - :response-time ms', { stream: accessLogStream }));
  }

  checkConnection() {
    this.app.use(this.dbContext.checkConnection.bind(this.dbContext));
  }

  usePassport() {    
    this.passport = new Passport(this);
  }

  useRoutes() {
    let routingModule = new RoutesModule(this);
    routingModule.build();
  }

  useHandlers() {
    let successHandler = new SuccessHandler(this);
    let errorHandler = new ErrorHandler(this);
    
    this.app.use((request: IRequest, response: IResponse, next: express.NextFunction) => {
      successHandler.process(request, response, next);
    });
    
    this.app.use((error: any, request: IRequest, response: IResponse, next: express.NextFunction) => {
      errorHandler.process(error, request, response, next);
    });
  }

  startServer() {
    let options: ServerOptions = {
      key: readFileSync(this.environment.keys.key),
      cert: readFileSync(this.environment.keys.cert),
      passphrase: this.environment.keys.passphrase
    };
    
    createServer(options, <any>this.app).listen(this.environment.https.port, () => {
      this.logger.info(`NODE: HTTPS listening on port ${this.environment.https.port}.`);
    });
  }

  // add all database caches
  initCache() {
    this.cache = {      
      report: ReportCache,
      token: TokenCache,
      user: new UserCache(this)
    };
  }

  // run the server
  static async bootstrap() {
    let server = new Server();

    // Cannot work like this due to `-auth` flag when starting mongo instance
    // create Mongo user
    // server.createDatabaseUser();

    // setup database users and permissions
    await server.createSystemUser();
    let superAdminRole = await server.upsertSuperAdminRole();    
    await server.upsertSuperAdminUser(superAdminRole);

    // had to be here because we need systemUser in the database
    server.initCache();

    // start server
    server.startServer();

    return server;
  }
  
  // createDatabaseUser() {    
  //   execSync(`mongo ${this.environment.MONGO_DB.URL}/${this.environment.MONGO_DB.DATABASE_NAME} --eval "db.dropUser('${this.environment.MONGO_DB.USER}')"`, { stdio:[0,1,2] });
  //   execSync(`mongo ${this.environment.MONGO_DB.URL}/${this.environment.MONGO_DB.DATABASE_NAME} --eval "db.createUser({ user: '${this.environment.MONGO_DB.USER}', pwd: '${this.environment.MONGO_DB.PASSWORD}', roles: [{ role: 'readWrite', db: '${this.environment.MONGO_DB.DATABASE_NAME}'}]})"`, { stdio:[0,1,2] });
  // }

  async createSystemUser(): Promise<void> {
    let ur = new UserRepository(this, this.systemUserId);

    let system = (await ur.databaseModel.findOne({
      'isSystem': true
    }));

    if(!system) {
      system = await ur.create(user => {
        user.email = 'system';
        user.firstName = 'SYSTEM';
        user.lastName = 'SYSTEM';
        user.isSystem = true;
        user.isDeleted = true;
        user.role = null;
      });
    }

    this.systemUserId = system._id.toString();
  }

  async upsertSuperAdminRole(): Promise<Document & IRole> {
    let rr = new RoleRepository(this, this.systemUserId);

    let superAdminRole = await rr.databaseModel.findOne({
      'type': 'SUPER_ADMIN'
    });

    if(!superAdminRole) {
      superAdminRole = await rr.create(role => {
        role.type = 'SUPER_ADMIN';
        role.description = 'Super administrator';
        role.permissions = permissions.map(permission => {
          return {
            'type': permission.type,
            'description': permission.description
          };
        });
      });
    }
    else {
      superAdminRole = await rr.update(superAdminRole._id.toString(), role => {
        role.permissions = permissions.map(permission => {
          return {
            'type': permission.type,
            'description': permission.description
          };
        });
      });
    }

    return superAdminRole;
  }  

  async upsertSuperAdminUser(superAdminRole: Document & IRole) {
    let ur = new UserRepository(this, this.systemUserId);

    let admin = await ur.databaseModel.findOne({
      'isAdmin': true
    });

    if(!admin) {
      admin = await ur.create(user => {
        user.email = this.environment.superAdmin.email;
        user.firstName = this.environment.superAdmin.firstName;
        user.lastName = this.environment.superAdmin.lastName;
        user.passwordHash = Util.generateHash(this.environment.superAdmin.password);
        user.isAdmin = true;
        user.role = superAdminRole._id.toString();
      });
    }
    else {
      admin = await ur.update(admin._id.toString(), user => {
        user.email = this.environment.superAdmin.email;
        user.firstName = this.environment.superAdmin.firstName;
        user.lastName = this.environment.superAdmin.lastName;
        user.passwordHash = Util.generateHash(this.environment.superAdmin.password);
      });
    }   
  }  
}