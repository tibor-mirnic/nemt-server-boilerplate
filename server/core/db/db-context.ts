import * as mongoose from 'mongoose';
import { NextFunction } from 'express';
import { EventEmitter } from 'events';

import { IEnvironment } from '../models/environment';
import { DatabaseError } from '../error/server';
import { IRequest } from '../models/express/request';
import { IResponse } from '../models/express/response';
import { Logger } from '../logger';

let dbConnection: mongoose.Connection;
let connectionEstablished = false;

export class DbContext extends EventEmitter {
  public mongoUri: string;

  public environment: IEnvironment;

  public poolSize: number;

  constructor(environment: IEnvironment, poolSize = 30) {
    super();

    (<any>mongoose.Promise) = global.Promise;

    this.environment = environment;
    this.poolSize = poolSize;

    if (!dbConnection) {
      this.initConnection();
    }
  }

  static async connect(environment: IEnvironment, poolSize = 30): Promise<void> {
    try {
      const dbContext = await new Promise<DbContext | null>((resolve, reject) => {
        const context = new DbContext(environment, poolSize);
        context.on('connection-established', () => {
          resolve(context);
        });

        context.on('connection-failed', error => {
          reject(error);
        });
      });

      if (!dbContext) {
        throw new DatabaseError('Could not connect to the database!');
      }
    } catch (error) {
      throw error;
    }
  }

  static getConnection(): mongoose.Connection {
    return dbConnection;
  }

  static checkConnection(request: IRequest, response: IResponse, next: NextFunction) {
    if (!connectionEstablished) {
      Logger.info('MONGO - Database connection could not be established!');
      next(new DatabaseError('Could not connect to the database!'));
    }

    next();
  }

  initConnection() {
    const me = this;

    this.mongoUri = `mongodb://${ this.environment.mongoDb.url }/${ this.environment.mongoDb.databaseName }`;

    Logger.info(`APPLICATION: Environment: ${ this.environment.name }!`);
    Logger.info(`MONGO: Connection attempted with ${ this.environment.mongoDb.user }:${ this.environment.mongoDb.password }`);

    dbConnection = mongoose.createConnection(this.mongoUri, {
      'user': this.environment.mongoDb.user,
      'pass': this.environment.mongoDb.password,
      'useNewUrlParser': true,
      'poolSize': this.poolSize
    });

    dbConnection.on('connected', function () {
      Logger.info('MONGO: Mongoose connected!');
      connectionEstablished = true;
      me.emit('connection-established');
    });

    dbConnection.on('disconnected', function (error) {
      Logger.info('MONGO: Mongoose disconnected!');
      connectionEstablished = false;
      me.emit('connection-disconnected', error);
    });

    dbConnection.on('error', function (error) {
      Logger.info('MONGO: Mongoose disconnected!');
      connectionEstablished = false;
      me.emit('connection-failed', error);
    });

    process.on('SIGINT', function () {
      console.log('SIGINT triggered');
      dbConnection.close();
      setTimeout(function () {
        process.exit();
      }, 1000);
    });
  }

  async disconnect(): Promise<void> {
    try {
      await new Promise<boolean>((resolve, reject) => {
        if (connectionEstablished && dbConnection) {
          dbConnection.close();

          this.on('connection-disconnected', () => {
            resolve(true);
          });
        } else {
          throw new DatabaseError('Connection was not estabilshed!');
        }
      });
    } catch (error) {
      throw error;
    }
  }
}
