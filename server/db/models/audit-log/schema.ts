import { SchemaDefinition } from 'mongoose';

import { constants  } from './../../../config/constants';

export const AuditLogSchema: SchemaDefinition = {
  collectionName: {
    type: String,
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  operation: {
    type: String,
    enum: constants.auditLogOperations,
    default: constants.auditLogOperations[0] // CREATE
  },
  dataBefore: {
    type: String,
    default: '{}'
  },
  dataAfter: {
    type: String,
    default: '{}'
  },
  createdAt: {
    type: Date,
    default: null
  }
}