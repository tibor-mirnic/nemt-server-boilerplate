import { DocumentToObjectOptions } from 'mongoose';

// each model has excludeProps defined as an Array of Strings
// for additional document processing define processDocument function in model definition

export interface ITransformOptions extends DocumentToObjectOptions {
  excludeProps?: string[];
  processDocument?: (doc: any, obj: any, options: any) => void;
  transform?: any;
}

export const transform = function(doc: any, obj: any, options: ITransformOptions) {
  // delete default props
  delete obj['__v'];

  if(typeof(options.processDocument) === 'function') {
    options.processDocument(doc, obj, options);
  }

  if(Array.isArray(options.excludeProps)) {
    options.excludeProps.forEach((prop: string) => {
      delete obj[prop];
    });
  }

  return obj;
}