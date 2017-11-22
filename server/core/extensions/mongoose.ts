import { Document, DocumentToObjectOptions } from 'mongoose';

// each model has excludeProps? defined as an Array of Strings
// for additional document processing define processDocument? function in model definition

export interface ITransformOptions<E> extends DocumentToObjectOptions {
  processDocument?: (doc: Document & E, obj: any & E, options: ITransformOptions<E>) => void;
  applyProcessDocumentToAll?: boolean;
  excludeProps?: string[];
  applyExcludePropsForAll?: boolean;
}