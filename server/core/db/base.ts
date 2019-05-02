import { SchemaDefinition } from 'mongoose';

export const BaseSchemaDefinition: SchemaDefinition = {
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: null
  },
  updatedBy: {
    type: String,
    default: null
  }
};
