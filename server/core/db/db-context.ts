import * as mongoose from 'mongoose';
import { NextFunction } from 'express';

import { MissingArgumentsError } from './../error/server';
import { IEnvironment } from './../models/environment';
import { DatabaseError } from './../error/server';
import { IRequest } from './../models/express/request';
import { IResponse } from './../models/express/response';
import { Logger } from './../logger';

let dbConnection: mongoose.Connection;
let connectionEstablished = false;

export class DbContext {
  public mongoUri: string;
  
  public environment: IEnvironment;
  public logger: Logger;

  public poolSize: number;

  constructor(environment: IEnvironment, logger: Logger, poolSize = 30) {
    if(!environment || !logger) {
      throw new MissingArgumentsError('Missing parameters in constructor!');
    }

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
      'server': {
        'poolSize': this.poolSize
      }
    });

    dbConnection.on('connected', function() {      
      me.logger.info('MONGO: Mongoose connected!');
      connectionEstablished = true;
    });

    dbConnection.on('disconnected', function() {
      me.logger.info('MONGO: Mongoose disconnected!');
      connectionEstablished = false;
    });

    dbConnection.on('error', function() {
      me.logger.info('MONGO: Mongoose disconnected!');
      connectionEstablished = false;
    });

    process.on('SIGINT', function() {
      console.log("SIGINT triggered");
      dbConnection.close();
      setTimeout(function() {
        process.exit();
      }, 1000); 
    });        
  }

  isConnected(): boolean {
    return connectionEstablished;
  }

  getConnection(): mongoose.Connection {
    return dbConnection;
  }

  disconnect() {
    if(connectionEstablished && dbConnection) {
      dbConnection.close();
    }
  }

  checkConnection(request: IRequest, response: IResponse, next: NextFunction) {
    if(!connectionEstablished) {
      this.logger.info('MONGO - Database connection could not be established!');
      return next(new DatabaseError('Could not connect to the database!', 'Connection'));
    }

    return next();
  }
}
