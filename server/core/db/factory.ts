import { Connection, Document, DocumentToObjectOptions, Model, Schema, SchemaDefinition } from 'mongoose';

import { ISchemaIndex } from '../extensions/mongoose';

export interface IFactoryConfiguration {
  connection: Connection;
  name: string;
  definition: SchemaDefinition;
  indexes?: ISchemaIndex[];
}

/**
 * Factory class for Mongoose Model initialization
 *
 * @export
 * @class Factory
 * @template E Model Interface
 */
export class Factory<E> {
  private _model: Model<Document & E>;
  private connection: Connection;
  private definition: SchemaDefinition;
  private indexes?: ISchemaIndex[];

  public name: string;

  public get model(): Model<Document & E> {
    return this._model;
  }

  /**
   * Creates an instance of Factory.
   * @param {IFactoryConfiguration} config
   * @memberof Factory
   */
  constructor(config: IFactoryConfiguration) {
    this.connection = config.connection;
    this.name = config.name;
    this.definition = config.definition;
    this.indexes = config.indexes;

    let schema = new Schema(this.definition);
    schema.set('toJSON', {
      'transform': function (doc: Document & E, obj: any & E, options: DocumentToObjectOptions) {
        var options = options || {};

        // delete default props
        delete obj['__v'];

        return obj;
      }
    });

    if (this.indexes) {
      this.indexes.forEach(index => {
        schema.index(index.fields, index.options);
      });
    }

    this._model = this.connection.model<Document & E>(this.name, schema);
  }
}
