export interface ISoftDelete {
  isDeleted: boolean;

  deletedAt?: Date;
  deletedBy?: string;
}

export interface IAuditInfo {
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
}
