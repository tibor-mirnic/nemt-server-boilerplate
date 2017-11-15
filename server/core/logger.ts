require('winston-daily-rotate-file');

import * as path from 'path';
import { Logger as WinstonLogger, LoggerInstance, transports } from 'winston';

import { IRequest } from './models/express/request';
import { ErrorBase } from './error/base';

let logger: LoggerInstance; 

export class Logger {
  constructor(folderPath: string) {
    if(!logger) {
      logger = new WinstonLogger({ 
        emitErrs: true,        
        exitOnError: false
      });
      
      logger.add(transports.DailyRotateFile, {
        level: 'debug',
        filename: path.join(folderPath, '.log'),
        datePattern: 'yyyy-MM-dd',
        prepend: true,
        handleExceptions: true,
        humanReadableUnhandledException: true,
        timestamp: true,
        json: false,
        prettyPrint: false            
      });

      logger.add(transports.Console, {
        level:'debug',
        name: 'console',
        handleExceptions: true,
        humanReadableUnhandledException: true,
        prettyPrint: true,
        silent: false,
        timestamp: true,
        colorize: true,
        json: false
      });
    }
  }

  info(msg: string) {
    logger.info(msg);
  }

  begin() {
    logger.info(`******************** ENTRY START ********************`);
  }
  
  end(error: any) {
    let msg = null;
    if (typeof (error) === 'string') {
      msg = error;
    }
    else if (error instanceof ErrorBase) {
      msg = error.prettify();
    }
    else {
      msg = error.stack || error.message;
    }

    logger.error(msg);
    logger.info(`******************** ENTRY END ********************`);
  }

  log(error: any) {
    this.begin();
    this.end(error);
  }

  logRequest(error: any, request: IRequest) {
    //log user      
    this.begin();

    logger.info(`User: ${request.user ? request.user.email : 'Unknown'}`);
    logger.info(`Url: ${request.url}`);
    logger.info(`Params: ${JSON.stringify(request.params)}`);
    logger.info(`Payload: ${JSON.stringify(request.body)}`);
    
    this.end(error);

    return error;
  }
}