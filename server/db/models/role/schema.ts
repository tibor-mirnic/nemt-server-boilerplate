import { SchemaDefinition } from 'mongoose';

import { BaseSchemaDefinition } from '../../../core/db/base';

export const RoleSchema: SchemaDefinition = {
  permissions: [{
    _id: false, // mongoose creates ids automatically
    type: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: null
    }
  }],
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  ...BaseSchemaDefinition
};
