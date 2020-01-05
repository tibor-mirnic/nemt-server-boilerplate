import { IUser } from '../db/models/user/user';

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
import { DbContext } from './db/db-context';
import { PassportStrategies } from './auth/strategies';

import { FactoryBuilder, IFactories } from '../db/factories';

import { Util } from './util/util';

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

const fileStreamRotator = require('file-stream-rotator');
const busboy = require('connect-busboy');

export class Server {
  public serverLogPath: string;
  public httpLogPath: string;
  public exportPath: string;

  public app: express.Application;

  public environment: IEnvironment;

  public factories: IFactories;

  public auditLogger: AuditLogRepository;

  public systemUserId: string;

  constructor() {
    this.initFolderPaths();

    Logger.init(this.serverLogPath);
    this.environment = Environment.load();
  }

  // run the server
  static async bootstrap() {
    const server = new Server();

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

    server.buildPassportStrategies();
    server.useRoutes();

    server.useHandlers();

    // setup database users and permissions
    const superAdminRole = await server.upsertSuperAdminRole();
    await server.upsertSuperAdminUser(superAdminRole);

    // start server
    server.startServer();

    return server;
  }

  async initDatabase() {
    await DbContext.connect(this.environment);
    this.factories = FactoryBuilder.build(DbContext.getConnection());
  }

  initFolderPaths() {
    this.serverLogPath = join(__dirname, '../private', 'log', 'server');
    this.httpLogPath = join(__dirname, '../private', 'log', 'http');
    this.exportPath = join(__dirname, '../private', 'tmp', 'export');
  }

  useHeaders() {
    const corsOptions = {
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
    const accessLogStream = fileStreamRotator.getStream({
      'date_format': 'YYYY-MM-DD',
      'filename': join(this.httpLogPath, '%DATE%.log'),
      'frequency': 'daily',
      'verbose': false
    });

    this.app.use(morgan(':date[iso] - :method :url :status :res[content-length] B - :response-time ms'));
    this.app.use(morgan(':date[iso] - :method :url :status :res[content-length] B - :response-time ms', { stream: accessLogStream }));
  }

  checkConnection() {
    this.app.use(DbContext.checkConnection);
  }

  buildPassportStrategies() {
    const strategies = new PassportStrategies(this);
    strategies.build();
  }

  useRoutes() {
    const routingModule = new RoutesModule(this);
    routingModule.build();
  }

  useHandlers() {
    this.app.use(SuccessHandler.process);
    this.app.use(ErrorHandler.process);
  }

  startServer() {
    const options: ServerOptions = {
      key: readFileSync(this.environment.keys.key),
      cert: readFileSync(this.environment.keys.cert),
      passphrase: this.environment.keys.passphrase
    };

    createServer(options, <any>this.app).listen(this.environment.https.port, () => {
      Logger.info(`NODE: HTTPS listening on port ${ this.environment.https.port }.`);
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
      (<IUser>system).isDeleted = true;
      system.role = undefined;
      system.status = 'active';

      await system.save();
    }

    this.systemUserId = system._id.toString();
  }

  async upsertSuperAdminRole(): Promise<Document & IRole> {
    const rr = new RoleRepository(this, this.systemUserId);

    let superAdminRole = await rr.databaseModel.findOne({
      'type': 'SUPER_ADMIN'
    });

    if (!superAdminRole) {
      superAdminRole = await rr.create(role => {
        role.type = 'SUPER_ADMIN';
        role.description = 'Super administrator';
        role.permissions = permissions;
      });
    } else {
      superAdminRole = await rr.update(superAdminRole._id.toString(), role => {
        role.permissions = permissions;
      });
    }

    return superAdminRole;
  }

  async upsertSuperAdminUser(superAdminRole: Document & IRole) {
    const ur = new UserRepository(this, this.systemUserId);

    const admin = await ur.databaseModel.findOne({
      'isAdmin': true
    });

    if (!admin) {
      await ur.create(user => {
        user.email = this.environment.superAdmin.email;
        user.firstName = this.environment.superAdmin.firstName;
        user.lastName = this.environment.superAdmin.lastName;
        user.passwordHash = Util.generateHash(this.environment.superAdmin.password);
        user.status = 'active';
        user.isAdmin = true;
        user.role = superAdminRole._id.toString();
      });
    } else {
      await ur.update(admin._id.toString(), user => {
        user.email = this.environment.superAdmin.email;
        user.firstName = this.environment.superAdmin.firstName;
        user.lastName = this.environment.superAdmin.lastName;
        user.passwordHash = Util.generateHash(this.environment.superAdmin.password);
        user.status = 'active';
      });
    }
  }
}
