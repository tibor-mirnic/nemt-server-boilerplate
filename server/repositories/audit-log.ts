import { Model, Document } from 'mongoose';

import { Server } from './../core/server';

import { IAuditLog } from '../db/models/audit-log/audit-log';
import { IAuditLogger, AuditLogOperation } from '../core/models/audit-log';
import { AuditLogFactory } from '../db/models/audit-log/factory';


export class AuditLogRepository  implements IAuditLogger {
  private factory: AuditLogFactory;

  get databaseModel(): Model<Document & IAuditLog> {
    return this.factory.model;
  }

  constructor(server: Server) {    
    this.factory = server.factories.auditLog;
  }

  public async log(collectionName: string, entityId: string, userId: string, operation: AuditLogOperation, dataBefore: any, dataAfter: any): Promise<void> {
    try {
      let model = new this.databaseModel();
            
      model.collectionName = collectionName;
      model.entityId = entityId;
      model.userId = userId;
      model.operation = operation;

      model.dataBefore = JSON.stringify(dataBefore);
      model.dataAfter = JSON.stringify(dataAfter);
      
      model.createdAt = new Date();

      await model.save();          
    }
    catch(error) {
      throw error;
    }
  }
}