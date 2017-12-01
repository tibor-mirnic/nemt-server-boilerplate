import { Model, Document } from 'mongoose';
import { merge } from 'lodash';

import { Factory } from './../core/db/factory';
import { IRepositoryConfiguration, IAggregationQuery, transformAggregationQuery } from './extensions/repository';
import { AuditInfo, Operation } from './extensions/audit-info';
import { DatabaseError } from './error/server';
import { NotFoundError } from './error/not-found';

/**
 * Helper class for Mongoose
 * 
 * @export
 * @class Repository
 * @template E Model interface
 */
export class Repository<E> {
  private factory: Factory<E>;
  private userId?: string;
  private aggreagationQuery: IAggregationQuery;
  private processDocument?: (record: E) => void;

  get databaseModel(): Model<Document & E> {
    return this.factory.model;
  }

  constructor(config: IRepositoryConfiguration<E>) {
    this.factory = config.factory;
    this.userId = config.userId;
    this.aggreagationQuery = config.aggregationQuery;
    this.processDocument = config.processDocument;
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
   * Returns model using aggregate
   * 
   * @param {any} [match={}] 
   * @returns {(Promise<Document & E | null>)} 
   * @memberof Repository
   */
  async findOne(match = {}): Promise<Document & E | null> {
    try {      
      let query = transformAggregationQuery(merge({}, this.aggreagationQuery, <IAggregationQuery>{ match: match }), false);
      let models = <(Document & E)[]>(await this.databaseModel.aggregate(query));

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

      if(this.userId) {
        model = AuditInfo.beforeSave(model, this.userId, Operation.CREATE);
      }
      
      await model.save();      
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
      update(model);
      

      if(this.userId) {
        model = AuditInfo.beforeSave(model, this.userId, Operation.UPDATE);
      }
      
      await model.save();      
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

      if(this.userId) {
        model = AuditInfo.beforeSave(model, this.userId, Operation.DELETE);
      }
      
      await model.save();            
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

      await model.remove();
    }
    catch(error) {
      throw error;
    }
  }

  /**
   * Hard delete a model by query
   * 
   * @param {*} query 
   * @param {((model: Document & E) => Promise<boolean>)} [validate] 
   * @returns {Promise<void>} 
   * @memberof Repository
   */
  async deleteHardByQuery(query: any, validate?: (model: Document & E) => Promise<boolean>): Promise<void> {
    try {
      let model = await this.findOne(query);

      if(!model) {
        throw new NotFoundError('Record not found');
      }

      if(validate) {
        let valid = await validate(model);
        if(!valid) {
          throw new DatabaseError('Unable to hard delete record! Validation failed.');
        }
      }

      await model.remove();
    }
    catch(error) {
      throw error;
    }
  }
  

  async query(aggregationQuery?: IAggregationQuery): Promise<(Document & E)[]> {
    try {      
      let query = transformAggregationQuery(merge({}, this.aggreagationQuery, aggregationQuery));
      let models = <(Document & E)[]>(await this.databaseModel.aggregate(query));
      return models;
    }
    catch(error) {
      throw error;
    }
  }

  /**
   * Get document count
   * 
   * @param {any} [query={}] 
   * @returns {Promise<number>} 
   * @memberof Repository
   */
  async count(query = {}): Promise<number> {
    try {
      query = query || {};

      let q = this.databaseModel.count(query);      

      let count = await q;

      return count;
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