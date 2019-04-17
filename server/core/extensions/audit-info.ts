import { IAuditInfo, ISoftDelete } from '../models/db/audit-info';

export enum Operation {
  CREATE = 0,
  UPDATE = 1,
  DELETE = 2
}

export class AuditInfo {
  static beforeCreate(model: IAuditInfo, userId: string) {
    let now = new Date();
    model.createdAt = now;
    model.createdBy = userId;

    return model;
  }

  static beforeUpdate(model: IAuditInfo, userId: string) {
    let now = new Date();
    model.updatedAt = now;
    model.updatedBy = userId;

    return model;
  }

  static beforeDelete(model: ISoftDelete, userId: string) {
    let now = new Date();
    model.isDeleted = true;
    model.deletedAt = now;
    model.deletedBy = userId;

    return model;
  }

  static beforeSave(model: any, userId: string, operation: Operation) {
    switch (operation) {
      case Operation.CREATE: {
        return AuditInfo.beforeCreate(model, userId);
      }
      case Operation.UPDATE: {
        return AuditInfo.beforeUpdate(model, userId);
      }
      case Operation.DELETE: {
        return AuditInfo.beforeDelete(model, userId);
      }
      default: {
        return model;
      }
    }
  }
}
