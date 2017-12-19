import { IIdentifier } from './../../../core/models/db/identifier';

export interface IAuditLog extends IIdentifier {
  collectionName: string;
  entityId: string;
  userId: string;
  operation: string;
  dataBefore: string;
  dataAfter: string;
  createdAt?: Date
}