import { SchemaTypes, SchemaDefinition } from 'mongoose';

export const UserSchema: SchemaDefinition = {
  role: {
    ref: 'Role',
    type: SchemaTypes.ObjectId,
    default: null
  },  
  email: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  passwordHash: {
    type: String,
    default: null
  },
  isSystem: {
    type: String,
    default: false
  },
  isAdmin: {
    type: String,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: null
  },
  updatedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    default: null
  },
  updatedBy: {
    type: String,
    default: null
  },
  deletedBy: {
    type: String,
    default: null
  }
};