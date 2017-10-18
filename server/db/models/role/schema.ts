import { SchemaDefinition } from 'mongoose';

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
}