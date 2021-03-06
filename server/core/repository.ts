import { Model, Document } from 'mongoose';
import { merge, mergeWith, cloneDeep } from 'lodash';

import { Factory } from './../core/db/factory';
import { IRepositoryConfiguration, IAggregationQuery, transformAggregationQuery } from './extensions/repository';
import { AuditInfo, Operation } from './extensions/audit-info';
import { DatabaseError } from './error/server';
import { NotFoundError } from './error/not-found';
import { IIdentifier } from './models/db/identifier';
import { IAuditLogger, AuditLogOperation } from './models/audit-log';

/**
 * Helper class for Mongoose
 * 
 * @export
 * @class Repository
 * @template E Model interface
 */
export class Repository<E extends IIdentifier> {
  private factory: Factory<E>;
  private userId: string;
  private aggreagationQuery: IAggregationQuery;  
  private processDocument?: (record: E) => void;

  public auditLogger: IAuditLogger;

  get databaseModel(): Model<Document & E> {
    return this.factory.model;
  }

  constructor(config: IRepositoryConfiguration<E>) {
    this.factory = config.factory;
    this.userId = config.userId;
    this.aggreagationQuery = merge(<IAggregationQuery>{
      $project: {
        '__v': 0
      }
    }, config.aggregationQuery);
    this.processDocument = config.processDocument;
    
    this.auditLogger = config.auditLogger;
  }
  
  /**
   * Get plain object from model
   * 
   * @param {(Document & E)} model 
   * @returns {E}
   * @memberof Repository
   */
  transformObject(model: Document & E): E {
    let viewModel: E = <E>model.toJSON();
    
    if(this.processDocument) {
      this.processDocument(viewModel);
    }

    return viewModel;
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
  mergeWithCustomizer(value: any, srcValue: any, key: string, object: any, source: any): any {
    if(Array.isArray(object[key])) {
      return cloneDeep(source[key]);
    }
    
    if(key === '$sort') {
      if(JSON.stringify(srcValue) === JSON.stringify({})) {
        return object[key];
      }
      else {        
        return srcValue;
      }
    }
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
      let model = await this.databaseModel.findById(id);

      if(!model) {
        throw new NotFoundError('Record not found!');
      }

      return model;
    }
    catch(error) {
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
      let model = await this.databaseModel.findById(id);

      return model;
    }
    catch(error) {
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
      let query = transformAggregationQuery(mergeWith({}, this.aggreagationQuery, <IAggregationQuery>{ $match: match }, this.mergeWithCustomizer), false);
      let models = <E[]>(await this.databaseModel.aggregate(query));

      if(models.length === 0) {
        throw new NotFoundError('Record not found!');
      }

      return models[0];
    }
    catch(error) {
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
      let query = transformAggregationQuery(mergeWith({}, this.aggreagationQuery, <IAggregationQuery>{ $match: match }, this.mergeWithCustomizer), false);
      let models = <E[]>(await this.databaseModel.aggregate(query));

      return models[0];
    }
    catch(error) {
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
      let model = new this.databaseModel();
      
      init(model);
      model = AuditInfo.beforeSave(model, this.userId, Operation.CREATE);
      
      await model.save();
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.CREATE, {}, this.transformObject(model));
      return model;
    }
    catch(error) {
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
      let model = await this.getById(id);
      let dataBefore = this.transformObject(model);

      update(model);      
      model = AuditInfo.beforeSave(model, this.userId, Operation.UPDATE);
      
      await model.save();
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.UPDATE, dataBefore, this.transformObject(model));
      return model;      
    }
    catch(error) {
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
      let model = await this.getById(id);      

      if(validate) {
        let valid = await validate(model);
        if(!valid) {
          throw new DatabaseError('Unable to soft delete record! Validation failed.');
        }
      }

      let dataBefore = this.transformObject(model);
      model = AuditInfo.beforeSave(model, this.userId, Operation.DELETE);
      
      await model.save();
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.DELETE, dataBefore, this.transformObject(model));
    }
    catch(error) {
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
      let model = await this.getById(id);

      if(validate) {
        let valid = await validate(model);
        if(!valid) {
          throw new DatabaseError('Unable to hard delete record! Validation failed.');
        }
      }

      let dataBefore = this.transformObject(model);
      await model.remove();
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.HARD_DELETE, dataBefore, {});
    }
    catch(error) {
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
      let model = await this.findOne(match);      

      if(!model) {
        throw new NotFoundError('Record not found');
      }      

      if(validate) {
        let valid = await validate(model);
        if(!valid) {
          throw new DatabaseError('Unable to hard delete record! Validation failed.');
        }
      }

      await this.databaseModel.findOneAndRemove({
        '_id': model._id
      });
      await this.auditLogger.log(this.factory.name, model._id.toString(), this.userId, AuditLogOperation.HARD_DELETE, model, {});
    }
    catch(error) {
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
      let query = transformAggregationQuery(mergeWith({}, this.aggreagationQuery, aggregationQuery, this.mergeWithCustomizer));
      let models = <E[]>(await this.databaseModel.aggregate(query));
      return models;
    }
    catch(error) {
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
      let query = transformAggregationQuery(mergeWith({}, this.aggreagationQuery, <IAggregationQuery>{ $match: match }, this.mergeWithCustomizer), false);
      query.push({
        '$count': 'total_records'
      });

      let total: any[] = <(Document & E)[]>(await this.databaseModel.aggregate(query));

      return total[0] ? total[0].total_records : 0;
    }
    catch(error) {
      throw error;
    }
  }

  /**
   * Get disctinct documents
   * 
   * @param {string} [query=''] 
   * @returns {(Promise<(Document & E)[]>)} 
   * @memberof Repository
   */
  async distinct(query = ''): Promise<(Document & E)[]> {
    try {
      let q = this.databaseModel.distinct(query);      

      let distinct = await q; 

      return distinct;
    }
    catch(error) {
      throw error;
    }
  }
}