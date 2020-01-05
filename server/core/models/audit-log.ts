export enum AuditLogOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  HARD_DELETE = 'HARD_DELETE',
  EXTERNAL = 'EXTERNAL'
}

export interface IAuditLogger {
  log: (collectionName: string, entityId: string, userId: string, operation: AuditLogOperation, dataBefore: any, dataAfter: any) => Promise<void>;
}
