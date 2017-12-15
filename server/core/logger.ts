require('winston-daily-rotate-file');

import * as path from 'path';
import { Logger as WinstonLogger, LoggerInstance, transports } from 'winston';

import { IResponse } from './models/express/response';
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

  prettifyError(error: any): string {
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

    return msg;
  }

  info(msg: string) {
    logger.info(msg);
  }

  error(error: any) {
    logger.error(this.prettifyError(error));
  }

  logRequest(error: any, response: IResponse) {
    let errorMsg = this.prettifyError(error);
    if(response.onErrorRequestData) {
      let msg = '\n';
      
      if(response.onErrorRequestData.userIdentifier) {
        msg += `  User: ${response.onErrorRequestData.userIdentifier}\n`;
      }

      msg += `  Url: ${response.onErrorRequestData.url}\n`;

      if(response.onErrorRequestData.params) {
        msg += `  Params: ${JSON.stringify(response.onErrorRequestData.params)}\n`;
      }

      if(response.onErrorRequestData.body) {
        msg += `  Payload: ${JSON.stringify(response.onErrorRequestData.body)}\n`;
      }

      msg += `  ${errorMsg}`;
    
      logger.error(msg);
    }
    else {
      logger.error(errorMsg);
    }
  }
}