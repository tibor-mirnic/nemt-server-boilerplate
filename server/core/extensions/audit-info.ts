import { IAuditInfo, ISoftDelete } from '../models/db/audit-info';

export class AuditInfo {
  static beforeCreate(model: IAuditInfo, userId: string): void {
    model.createdAt = new Date();
    model.createdBy = userId;
  }

  static beforeUpdate(model: IAuditInfo, userId: string): void {
    model.updatedAt = new Date();
    model.updatedBy = userId;
  }

  static beforeDelete(model: ISoftDelete, userId: string): void {
    model.isDeleted = true;
    model.deletedAt = new Date();
    model.deletedBy = userId;
  }
}
