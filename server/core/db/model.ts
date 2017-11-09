let deepPopulate = require('mongoose-deep-populate');

import * as mongoose from 'mongoose';
import { Connection, Schema, SchemaDefinition, Document, Model } from 'mongoose';

import { transform } from './../extensions/mongoose';

import { InternalServerError } from './../error/server';

export class ModelBase<E> {
  public dbConnection: Connection;
  public schemaName: string;
  public schemaDefinition: SchemaDefinition;
  public schema: Schema;

  public excludeProps?: string[];
  public processDocument?: (doc: any, obj: any, options: any) => void; // function for mongoose, must be es5
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

  applyToJSON(options = {}) {
    let newOptions = Object.assign({}, {
      excludeProps: this.excludeProps,
      transform: transform,
      processDocument: this.processDocument
    }, options);

    this.schema.set('toJSON', newOptions);
  }

  build(): Model<Document & E> {
    this.applyToJSON();    
    this.schema.methods.overrideToJSON = this.applyToJSON.bind(this);
    
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