import * as mongoose from 'mongoose';
import { NextFunction } from 'express';

import { IEnvironment } from './../models/environment';
import { DatabaseError } from './../error/server';
import { IRequest } from './../models/express/request';
import { IResponse } from './../models/express/response';
import { Logger } from './../logger';
import { EventEmitter } from 'events';

let dbConnection: mongoose.Connection;
let connectionEstablished = false;

export class DbContext extends EventEmitter {
  public mongoUri: string;
  
  public environment: IEnvironment;
  public logger: Logger;

  public poolSize: number;

  constructor(environment: IEnvironment, logger: Logger, poolSize = 30) {
    super();

    (<any>mongoose.Promise) = global.Promise;

    this.environment = environment;
    this.logger = logger;
    this.poolSize = poolSize;

    if(!dbConnection) {
      this.initConnection();
    }
  }

  initConnection() {
    let me = this;

    this.mongoUri = `mongodb://${this.environment.mongoDb.url}/${this.environment.mongoDb.databaseName}`;

    this.logger.info(`APPLICATION: Environment: ${this.environment.name}!`);
    this.logger.info(`MONGO: Connection attempted with ${this.environment.mongoDb.user}:${this.environment.mongoDb.password}`);
    
    dbConnection = mongoose.createConnection(this.mongoUri, {
      'user': this.environment.mongoDb.user,
      'pass': this.environment.mongoDb.password,
      'useMongoClient': true,      
      'poolSize': this.poolSize
    });

    dbConnection.on('connected', function() {      
      me.logger.info('MONGO: Mongoose connected!');
      connectionEstablished = true;
      me.emit('connection-established');
    });

    dbConnection.on('disconnected', function(error) {
      me.logger.info('MONGO: Mongoose disconnected!');
      connectionEstablished = false;
      me.emit('connection-disconnected', error); 
    });

    dbConnection.on('error', function(error) {
      me.logger.info('MONGO: Mongoose disconnected!');
      connectionEstablished = false;
      me.emit('connection-failed', error); 
    });

    process.on('SIGINT', function() {
      console.log("SIGINT triggered");
      dbConnection.close();
      setTimeout(function() {
        process.exit();
      }, 1000); 
    });        
  }

  static async connect(environment: IEnvironment, logger: Logger, poolSize = 30): Promise<DbContext> {
    try {
      let dbContext = await new Promise<DbContext | null>((resolve, reject) => {
        let context = new DbContext(environment, logger, poolSize);
        context.on('connection-established', () => {
          resolve(context);
        });        

        context.on('connection-failed', (error) => {
          reject(error);
        });
      });

      if(!dbContext) {
        throw new DatabaseError('Could not connect to the database!');
      }

      return dbContext;
    }
    catch(error) {
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await new Promise<boolean>((resolve, reject) => {        
        if(connectionEstablished && dbConnection) {
          dbConnection.close();

          this.on('connection-disconnected', () => {
            resolve(true);
          });
        }
        else {
          throw new DatabaseError('Connection was not estabilshed!');
        }
      });
    }
    catch(error) {
      throw error;
    }
  }

  isConnected(): boolean {
    return connectionEstablished;
  }

  getConnection(): mongoose.Connection {
    return dbConnection;
  }

  checkConnection(request: IRequest, response: IResponse, next: NextFunction) {
    if(!connectionEstablished) {
      this.logger.info('MONGO - Database connection could not be established!');
      return next(new DatabaseError('Could not connect to the database!'));
    }

    return next();
  }
}
