import { Document, DocumentToObjectOptions } from 'mongoose';

export interface ITransformOptions<E> extends DocumentToObjectOptions {
  processDocument?: (doc: Document & E, obj: any & E, options: ITransformOptions<E>) => void;
  applyProcessDocumentToAll?: boolean;
  excludeProps?: string[];
  applyExcludePropsForAll?: boolean;
}
export interface ISchemaIndex {
  fields: any;
  options?: {
    expires?: string;
    [other: string]: any;
  }
}