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
import { DbContext } from './db/db-context';
import { Passport } from './auth/passport';

import { FactoryBuilder, IFactories } from '../db/factories';

import { Util } from './util/util';

import { IRequest } from './models/express/request';
import { IResponse } from './models/express/response';
import { SuccessHandler } from './handlers/success';
import { ErrorHandler } from './handlers/error';

import { RoutesModule } from '../routes/module';
// db
import { permissions } from '../db/static/permissions';
// repositories
import { AuditLogRepository } from '../repositories/audit-log';
import { RoleRepository } from '../repositories/role';
import { IRole } from '../db/models/role/role';
import { UserRepository } from '../repositories/user';

export class Server {
  public serverLogPath: string;
  public httpLogPath: string;
  public exportPath: string;

  public app: express.Application;

  public logger: Logger;
  public environment: IEnvironment;
  public constants: IConstants;

  public dbContext: DbContext;
  public factories: IFactories;

  public auditLogger: AuditLogRepository;

  public passport: Passport;

  public systemUserId: string;

  constructor() {
    this.initFolderPaths();

    this.logger = new Logger(this.serverLogPath);
    this.environment = Environment.load();
  }

  // run the server
  static async bootstrap() {
    try {
      let server = new Server();

      await server.initDatabase();

      server.app = express();

      await server.createSystemUser();
      server.initAuditLogger();

      // build middleware
      server.useHeaders();
      server.useBodyParser();
      server.useBusboy();
      server.useMorgan();

      server.checkConnection();

      server.usePassport();
      server.useRoutes();

      server.useHandlers();

      // setup database users and permissions
      let superAdminRole = await server.upsertSuperAdminRole();
      await server.upsertSuperAdminUser(superAdminRole);

      // start server
      server.startServer();

      return server;
    } catch (error) {
      throw error;
    }
  }

  async initDatabase() {
    try {
      this.dbContext = await DbContext.connect(this.environment, this.logger);
      this.factories = FactoryBuilder.build(this.dbContext.getConnection());
    } catch (error) {
      throw error;
    }
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
        'fileSize': 10 * 1024 * 1024
      }
    }));
  }

  useMorgan() {
    let accessLogStream = fileStreamRotator.getStream({
      'date_format': 'YYYY-MM-DD',
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
      this.logger.info(`NODE: HTTPS listening on port ${ this.environment.https.port }.`);
    });
  }

  // create AuditLogger
  initAuditLogger() {
    this.auditLogger = new AuditLogRepository(this);
  }

  async createSystemUser(): Promise<void> {
    let system = await this.factories.user.model.findOne({
      'isSystem': true
    });

    if (!system) {
      system = new this.factories.user.model();
      system.email = 'system';
      system.firstName = 'SYSTEM';
      system.lastName = 'SYSTEM';
      system.isSystem = true;
      system.isDeleted = true;
      system.role = undefined;

      await system.save();
    }

    this.systemUserId = system._id.toString();
  }

  async upsertSuperAdminRole(): Promise<Document & IRole> {
    let rr = new RoleRepository(this, this.systemUserId);

    let superAdminRole = await rr.databaseModel.findOne({
      'type': 'SUPER_ADMIN'
    });

    if (!superAdminRole) {
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
    } else {
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

    if (!admin) {
      await ur.create(user => {
        user.email = this.environment.superAdmin.email;
        user.firstName = this.environment.superAdmin.firstName;
        user.lastName = this.environment.superAdmin.lastName;
        user.passwordHash = Util.generateHash(this.environment.superAdmin.password);
        user.isAdmin = true;
        user.role = superAdminRole._id.toString();
      });
    } else {
      await ur.update(admin._id.toString(), user => {
        user.email = this.environment.superAdmin.email;
        user.firstName = this.environment.superAdmin.firstName;
        user.lastName = this.environment.superAdmin.lastName;
        user.passwordHash = Util.generateHash(this.environment.superAdmin.password);
      });
    }
  }
}
