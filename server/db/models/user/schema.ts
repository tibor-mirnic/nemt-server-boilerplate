import { SchemaDefinition, SchemaTypes } from 'mongoose';

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
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
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
