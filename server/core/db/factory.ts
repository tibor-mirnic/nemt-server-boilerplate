import { Connection, Document, DocumentToObjectOptions, Model, Schema, SchemaDefinition } from 'mongoose';

import { ISchemaIndex } from '../extensions/mongoose';

export interface IFactoryConfiguration {
  connection: Connection;
  name: string;
  definition: SchemaDefinition;
  indexes?: ISchemaIndex[];
  collectionName?: string; // Should be used to avoid collection name pluralization
  preSave?: () => void;
}

/**
 * Factory class for Mongoose Model initialization
 *
 * @export
 * @class Factory
 * @template E Model Interface
 */
export class Factory<E> {
  private readonly _model: Model<Document & E>;

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
    this.name = config.name;

    let schema: Schema;
    if (config.collectionName) {
      schema = new Schema(config.definition, {
        collection: config.collectionName
      });
    } else {
      schema = new Schema(config.definition);
    }
    schema.set('toJSON', {
      'transform': function (doc: Document & E, obj: any & E, options: DocumentToObjectOptions) {
        // delete default props
        delete obj['__v'];

        return obj;
      }
    });

    if (config.indexes) {
      config.indexes.forEach(index => {
        schema.index(index.fields, index.options);
      });
    }

    if (config.preSave) {
      schema.pre('save', config.preSave);
    }

    this._model = config.connection.model<Document & E>(this.name, schema);
  }
}
