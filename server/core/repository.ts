import { Document, Model } from 'mongoose';
import { cloneDeep, merge, mergeWith } from 'lodash';

import { Factory } from './db/factory';
import { IAggregationQuery, IRepositoryConfiguration, transformAggregationQuery } from './extensions/repository';
import { AuditInfo } from './extensions/audit-info';
import { DatabaseError } from './error/server';
import { NotFoundError } from './error/not-found';
import { IIdentifier } from './models/db/identifier';
import { IAuditInfo, ISoftDelete } from './models/db/audit-info';
import { AuditLogOperation, IAuditLogger } from './models/audit-log';
import { Util } from './util/util';

/**
 * Helper class for Mongoose
 *
 * @export
 * @class Repository
 * @template E Model interface
 */
export class Repository<E extends IIdentifier & ISoftDelete & IAuditInfo> {
  public auditLogger: IAuditLogger;

  private readonly factory: Factory<E>;
  private readonly userId: string;
  private readonly aggregationQuery: IAggregationQuery;

  constructor(config: IRepositoryConfiguration<E>) {
    this.factory = config.factory;
    this.userId = config.userId;
    this.aggregationQuery = merge(<IAggregationQuery>{
      $project: {
        '__v': '$$REMOVE'
      }
    }, config.aggregationQuery);

    this.auditLogger = config.auditLogger;
  }

  get databaseModel(): Model<Document & E> {
    return this.factory.model;
  }

  /**
   * lodash mergeWith customizer
   * If propery is an array do not merge, just overwrite destination with source
   *
   * @param {*} value
   * @param {*} srcValue
   * @param {string} key
   * @param {*} object
   * @param {*} source
   * @returns {*}
   * @memberof Repository
   */
  static mergeWithCustomizer(value: any, srcValue: any, key: string, object: any, source: any): any {
    if (Array.isArray(object[key])) {
      return cloneDeep(source[key]);
    }

    if (key === '$sort') {
      if (JSON.stringify(srcValue) === JSON.stringify({})) {
        return object[key];
      } else {
        return srcValue;
      }
    }
  }

  /**
   * Get plain object from model
   *
   * @param {(Document & E)} model
   * @returns {E}
   * @memberof Repository
   */
  transformObject(model: Document & E): E {
    return <E>model.toJSON();
  }

  /**
   * Get plain objects from array of models
   *
   * @param {((Document & E)[])} models
   * @returns {E[]}
   * @memberof Repository
   */
  transformObjects(models: (Document & E)[]): E[] {
    return models.map((model: Document & E) => {
      return this.transformObject(model);
    });
  }

  /**
   * Returns model or throws NotFound exception
   *
   * @param {string} id
   * @returns {(Promise<Document & E>)}
   * @memberof Repository
   */
  async getById(id: string): Promise<Document & E> {
    try {
      const model = await this.databaseModel.findById(id);

      if (!model) {
        throw new NotFoundError('Record not found!');
      }

      return model;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Returns model or null
   *
   * @param {string} id
   * @returns {(Promise<Document & E | null>)}
   * @memberof Repository
   */
  async findById(id: string): Promise<Document & E | null> {
    try {
      return await this.databaseModel.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Returns model using aggregate or throws NotFound exception
   *
   * @param {any} [match={}]
   * @returns {(Promise<E>)}
   * @memberof Repository
   */
  async getOne(match = {}): Promise<E> {
    try {
      const query = transformAggregationQuery(mergeWith({}, this.aggregationQuery, <IAggregationQuery>{ $match: match }, Repository.mergeWithCustomizer), false);
      const models = <E[]>await this.databaseModel.aggregate(query);

      if (models.length === 0) {
        throw new NotFoundError('Record not found!');
      }

      return models[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Returns model using aggregate
   *
   * @param {any} [match={}]
   * @returns {(Promise<E | null>)}
   * @memberof Repository
   */
  async findOne(match = {}): Promise<E | null> {
    try {
      const query = transformAggregationQuery(mergeWith({}, this.aggregationQuery, <IAggregationQuery>{ $match: match }, Repository.mergeWithCustomizer), false);
      const models = <E[]>await this.databaseModel.aggregate(query);

      return models[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a model
   *
   * @param {((model: Document & E) => void)} init
   * @returns {(Promise<Document & E>)}
   * @memberof Repository
   */
  async create(init: (model: Document & E) => void): Promise<Document & E> {
    try {
      const model = new this.databaseModel();

      init(model);
      AuditInfo.beforeCreate(model, this.userId);

      await model.save();
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.CREATE, {}, this.transformObject(model));
      return model;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a model by id
   *
   * @param {string} id
   * @param {((model: Document & E) => void)} update
   * @returns {(Promise<Document & E>)}
   * @memberof Repository
   */
  async update(id: string, update: (model: Document & E) => void): Promise<Document & E> {
    try {
      const model = await this.getById(id);
      const dataBefore = this.transformObject(model);

      update(model);
      AuditInfo.beforeUpdate(model, this.userId);

      await model.save();
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.UPDATE, dataBefore, this.transformObject(model));
      return model;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete a model by id
   *
   * @param {string} id
   * @param {((model: Document & E) => Promise<boolean>)} [validate]
   * @returns {Promise<void>}
   * @memberof Repository
   */
  async delete(id: string, validate?: (model: Document & E) => Promise<boolean>): Promise<void> {
    try {
      const model = await this.getById(id);

      if (validate) {
        const valid = await validate(model);
        if (!valid) {
          throw new DatabaseError('Unable to soft delete record! Validation failed.');
        }
      }

      const dataBefore = this.transformObject(model);
      AuditInfo.beforeDelete(model, this.userId);

      await model.save();
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.DELETE, dataBefore, this.transformObject(model));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Hard delete a model by id
   *
   * @param {string} id
   * @param {((model: Document & E) => Promise<boolean>)} [validate]
   * @returns {Promise<void>}
   * @memberof Repository
   */
  async deleteHard(id: string, validate?: (model: Document & E) => Promise<boolean>): Promise<void> {
    try {
      const model = await this.getById(id);

      if (validate) {
        const valid = await validate(model);
        if (!valid) {
          throw new DatabaseError('Unable to hard delete record! Validation failed.');
        }
      }

      const dataBefore = this.transformObject(model);
      await model.remove();
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.HARD_DELETE, dataBefore, {});
    } catch (error) {
      throw error;
    }
  }

  /**
   * Hard delete a model by query
   *
   * @param {any} [match={}]
   * @param {((model: Document & E) => Promise<boolean>)} [validate]
   * @returns {Promise<void>}
   * @memberof Repository
   */
  async deleteHardByQuery(match = {}, validate?: (model: E) => Promise<boolean>): Promise<void> {
    try {
      const model = await this.findOne(match);

      if (!model) {
        throw new NotFoundError('Record not found');
      }

      if (validate) {
        const valid = await validate(model);
        if (!valid) {
          throw new DatabaseError('Unable to hard delete record! Validation failed.');
        }
      }

      await this.databaseModel.findOneAndRemove({
        '_id': model._id
      });
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.HARD_DELETE, model, {});
    } catch (error) {
      throw error;
    }
  }

  /**
   * Query models
   *
   * @param {IAggregationQuery} [aggregationQuery]
   * @returns {Promise<E[]>}
   * @memberof Repository
   */
  async query(aggregationQuery?: IAggregationQuery): Promise<E[]> {
    try {
      const query = transformAggregationQuery(mergeWith({}, this.aggregationQuery, aggregationQuery, Repository.mergeWithCustomizer));
      return <E[]>await this.databaseModel.aggregate(query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get document count
   *
   * @param {any} [match={}]
   * @returns {Promise<number>}
   * @memberof Repository
   */
  async count(match = {}): Promise<number> {
    try {
      const query = transformAggregationQuery(mergeWith({}, this.aggregationQuery, <IAggregationQuery>{ $match: match }, Repository.mergeWithCustomizer), false);
      query.push({
        $count: 'totalRecords'
      });

      const total: any[] = <(Document & E & { totalRecords: number })[]>await this.databaseModel.aggregate(query);

      return total[0] ? total[0].total_records : 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get distinct documents.
   *
   * @param {string} [query='']
   * @returns {(Promise<(Document & E)[]>)}
   * @memberof Repository
   */
  async distinct(query = ''): Promise<(Document & E)[]> {
    try {
      const q = this.databaseModel.distinct(query, this.aggregationQuery.$match);

      return await q;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search models by property name using $regex.
   *
   * @param {string} query
   * @param {string} [property = 'name']
   * @returns {Promise<E[]>}
   * @memberof Repository
   */
  async search(query: string, property = 'name'): Promise<E[]> {
    try {
      const q: any = {};
      q[property] = {
        $regex: Util.escapeRegExp(query),
        $options: 'i'
      };
      return <E[]>await this.query({ $match: q });
    } catch (error) {
      throw error;
    }
  }
}
