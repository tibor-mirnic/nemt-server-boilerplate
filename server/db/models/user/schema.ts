import { SchemaDefinition, SchemaTypes } from 'mongoose';

import { BaseSchemaDefinition } from '../../../core/db/base';

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
  status: {
    type: String,
    required: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  ...BaseSchemaDefinition
};
