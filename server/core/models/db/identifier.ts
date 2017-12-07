import { SchemaTypes } from 'mongoose';

export interface IIdentifier {
  _id: typeof SchemaTypes.ObjectId;
}