let deepPopulate = require('mongoose-deep-populate');

import * as mongoose from 'mongoose';
import { Connection, Schema, SchemaDefinition, Document, Model } from 'mongoose';

import { ITransformOptions } from './../extensions/mongoose';

import { InternalServerError } from './../error/server';

export class ModelBase<E> {
  public dbConnection: Connection;
  public schemaName: string;
  public schemaDefinition: SchemaDefinition;
  public schema: Schema;

  public excludeProps?: string[];
  public processDocument?: (doc: Document & E, obj: any & E, options: ITransformOptions<E>) => void; // function for mongoose, must be es5
  public indexes?: any[];
  public deepPopulate?: any;

  constructor(dbConnection: Connection, schemaName: string, schemaDefinition: SchemaDefinition) {
    this.dbConnection = dbConnection;
    this.schemaName = schemaName;
    this.schemaDefinition = schemaDefinition;    

    this.schema = new Schema(this.schemaDefinition);

    this.excludeProps = undefined;
    this.processDocument = undefined; //processDocument(doc, obj, options)
    this.indexes = undefined;
    this.deepPopulate = null;
  }

  build(): Model<Document & E> {
    let me = this;

    this.schema.set('toJSON', {
      'transform': function(doc: Document & E, obj: any & E, options: ITransformOptions<E>) {
        var options = options || {};
        
        // delete default props
        delete obj['__v'];
        
        // additional document processing
        if(!options.processDocument) {
          options.processDocument = me.processDocument;
        }
        if(typeof(options.processDocument) === 'function') {
          options.processDocument(doc, obj, options);
          
          // clear processDocument for Other
          if(!options.applyProcessDocumentToAll) {
            options.processDocument = undefined;
          }
        }
        
        // delete defined properties
        if(!options.excludeProps) {
          options.excludeProps = me.excludeProps || [];
        }
        else {        
          options.excludeProps = (me.excludeProps || []).concat(options.excludeProps);
        }

        if(Array.isArray(options.excludeProps)) {
          options.excludeProps.forEach((prop: string) => {
            delete obj[prop];
          });

          // clear excludeProps for Other
          if(!options.applyExcludePropsForAll) {
            options.excludeProps = undefined;
          }
        }       
      
        return obj;
      }
    });    
    
    // schema indexes
    if(this.indexes) {
      this.indexes.forEach(index => {
        if(!Array.isArray(index)) {
          throw new InternalServerError('Index must be defined as an array of 1 or 2 elements!');
        }

        if(index.length == 1) {
          this.schema.index(index[0]);
        }
        else { 
          this.schema.index(index[0], index[1]);
        }
      });
    }
    
    // deepPopulate
    if(this.deepPopulate) {      
      this.schema.plugin(deepPopulate(mongoose), this.deepPopulate);
    }    

    return this.dbConnection.model<Document & E>(this.schemaName, this.schema);
  }
}