import { Model, Document } from 'mongoose';

import { Logger } from './logger';
import { Util } from './util/util';
import { ErrorBase } from './error/base';
import { DatabaseError } from './error/server';
import { NotFoundError } from './error/not-found';
import { ITransformOptions } from './extensions/mongoose';
import { ProviderExtensions, Operation } from './extensions/provider';

import { IUser } from './../db/models/user/user';

export class Provider<E> {
  model: Model<Document & E>;
  userId?: string | null;
  logger?: Logger | null;

  constructor(model: Model<Document & E>, userId?: string | null, logger?: Logger | null) {
    this.model = model;
    this.userId = userId;    
    this.logger = logger;
  }

  handleError(error: any): ErrorBase {
    if(typeof(error) === 'string') {
      error = new DatabaseError((error || '').toString());
    }
    
    if(error instanceof Error && (
        error.name === 'Error' ||
        error.name === 'ReferenceError'||
        error.name === 'MongoError' ||
        error.name === 'MongooseError'||
        error.name === 'CastError')
    ) {
      error = new DatabaseError(error.message || error.stack, error.name);
    }

    if(this.logger) {
      this.logger.log(error);
    }

    return error;
  }


  /**
   * Mongoose toJSON method override
   * 
   * @param {MongooseModel} dbRecord 
   * @param {string[]} excludeProps 
   * @param {function} processRecord
   * @returns {MongooseModel}
   * 
   * @memberof Provider
   */
  transformObject(dbRecord: Document & E, excludeProps?: string[]): E {
    if(Array.isArray(excludeProps)) {
      return <E>dbRecord.toJSON(<ITransformOptions>{ excludeProps: excludeProps, transform: true });
    }
    
    return <E>dbRecord.toJSON();
  }

  /**
   * Transform array of Mongoose objects
   * 
   * @param {MongooseModel[]} dbRecords 
   * @param {string[]} excludeProps 
   * @returns {MongooseModel[]}
   * 
   * @memberof Provider
   */
  transformObjects(dbRecords: (Document & E)[], excludeProps?: string[]): E[] {
    return dbRecords.map((dbRecord: Document & E) => {
      return this.transformObject(dbRecord, excludeProps);
    });
  }


  /**
   * 
   * Check any of the permissions
   * 
   * @param {string[]} permissions 
   * @param {MoongooseModel} user 
   * @returns {boolean}
   * 
   * @memberof Provider
   */
  hasAnyPermission(permissions: string[], user: Document & IUser): boolean {
    if(user.isSystem || user.isAdmin) {
      return true;
    }
    
    let permDict: any = {};
    if(user.role) {
      permDict = Util.toDictionary(user.role.permissions, 'type');
    }
    
    // Intentionally used basic for because you cannot return(break the loop) from forEach
    for(let i = 0; i < permissions.length; i++) {
      if(permDict[permissions[i]]) {
        return true;
      }
    }

    return false;
  }

  /**
   * 
   * Check permission
   * 
   * @param {string} permission 
   * @param {MoongooseModel} user
   * @returns {boolean}
   * 
   * @memberof Provider
   */
  hasPermission(permission: string, user: Document & IUser): boolean {
    if(user.isSystem || user.isAdmin) {
      return true;
    }

    let permDict: any = {};
    if(user.role) {
      permDict = Util.toDictionary(user.role.permissions, 'type');
    }    
    
    return !!permDict[permission];
  }

  /**
   * Returns record or throws NotFound exception
   * 
   * @param {string} id 
   * @param {string|string[]} [include=undefined] 
   * @returns {MongooseModel}
   * 
   * @memberof Provider
   */
  async getById(id: string, include?: string | string[]): Promise<Document & E> {
    try {
      let q = this.model.findById(id);

      if (include) {
        let includes = Array.isArray(include) ? include.join(' ') : include;
        q = (<any>q).deepPopulate(includes);
      }

      let dbRecord = await q;

      if(!dbRecord) {
        throw new NotFoundError('Record not found!');
      }

      return dbRecord;
    }
    catch(error) {
      throw this.handleError(error);
    }
  }

  
  /**
   * Returns found record or undefined
   * 
   * @param {string} id 
   * @param {string|string[]} [include=undefined] 
   * @returns {MongooseModel|undefined}
   * 
   * @memberof Provider
   */
  async findById(id: string, include?: string | string[]): Promise<Document & E | null> {
    try {      
      let dbRecord = await this.findOne({
        '_id': id
      }, include);      

      return dbRecord;
    }
    catch(error) {
      throw this.handleError(error);
    }
  }


  /**
   * Returns found record or undefined
   * 
   * @param {Object} query 
   * @param {string|string[]} [include=undefined] 
   * @returns {MongooseModel|undefined}
   * 
   * @memberof Provider
   */
  async findOne(query: any, include?: string | string[]): Promise<Document & E | null> {
    try {
      query = query || {};

      let q = this.model.findOne(query);

      if (include) {
        let includes = Array.isArray(include) ? include.join(' ') : include;
        q = (<any>q).deepPopulate(includes);
      }

      let dbRecord = await q; 

      return dbRecord;
    }
    catch(error) {
      throw this.handleError(error);
    }
  }

  /**
   * Creates record
   * 
   * @param {function} init - (record: MongooseModel) => void
   * @param {string|string[]} [include=undefined]
   * @returns {MongooseModel}
   * 
   * @memberof Provider
   */
  async create(init: (record: Document & E) => void, include?: string | string[]): Promise<Document & E> { 
    try {
      let record = new this.model();

      if(init) {
        init(record);
      }

      if(this.userId) {
        record = ProviderExtensions.beforeSave(record, this.userId, Operation.CREATE);
      }
      
      await record.save();
      let dbRecord = await this.getById(record._id.toString(), include);
      return dbRecord;
    }
    catch(error) {
      throw this.handleError(error);
    }
  }

  /**
   * Updates record by id
   * 
   * @param {string} id 
   * @param {function} update - (record: MongooseModel) => void
   * @param {string|string[]} [include=undefined]
   * @returns {MoongooseModel}
   * 
   * @memberof Provider
   */
  async update(id: string, update: (record: Document & E) => void, include?: string | string[]): Promise<Document & E> { 
    try {
      let dbRecord = await this.getById(id);      
      
      if(update) {
        update(dbRecord);
      }

      if(this.userId) {
        dbRecord = ProviderExtensions.beforeSave(dbRecord, this.userId, Operation.UPDATE);
      }
      
      await dbRecord.save();
      let updatedRecord = await this.getById(dbRecord._id.toString(), include);
      return updatedRecord;      
    }
    catch(error) {
      throw this.handleError(error);
    }
  }

  /**
   * Soft deletes the record by id
   * 
   * @param {string} id 
   * @param {function} [validate] - async (record: MongooseModel) => boolean
   * 
   * @memberof Provider
   */
  async delete(id: string, validate?: (record: Document & E) => Promise<boolean>): Promise<void> {
    try {
      let dbRecord = await this.getById(id);      

      if(validate) {
        let valid = await validate(dbRecord);
        if(!valid) {
          throw new DatabaseError('Unable to soft delete record! Validation failed.');
        }
      }

      if(this.userId) {
        dbRecord = ProviderExtensions.beforeSave(dbRecord, this.userId, Operation.DELETE);
      }
      
      await dbRecord.save();            
    }
    catch(error) {
      throw this.handleError(error);
    }
  }

  /**
   * Hard deletes the record by id
   * 
   * @param {string} id 
   * @param {function} [validate] - async (record: MongooseModel) => boolean
   * 
   * @memberof Provider
   */
  async deleteHard(id: string, validate?: (record: Document & E) => Promise<boolean>): Promise<void> {
    try {
      let dbRecord = await this.getById(id);      

      if(validate) {
        let valid = await validate(dbRecord);
        if(!valid) {
          throw new DatabaseError('Unable to hard delete record! Validation failed.');
        }
      }

      await dbRecord.remove();
    }
    catch(error) {
      throw this.handleError(error);
    }
  }

  /**
   * Hard deletes the record by query
   * 
   * @param {Object} query   
   * 
   * @memberof Provider
   */
  async deleteHardByQuery(query: any): Promise<void> {
    try {
      let removedRecord = this.model.remove(query);

      if(!removedRecord) {
        throw new NotFoundError('Record not found');
      }
    }
    catch(error) {
      throw this.handleError(error);
    }
  }
  

  /**
   * Query records
   * 
   * @param {Object} [query]
   * @param {Number} [page]
   * @param {Number} [pageSize] 
   * @param {any} [sort]
   * @param {string|string[]} [include=undefined]
   * @returns {MongooseModel[]}
   * 
   * @memberof Provider
   */
  async query(query = {}, page?: number, pageSize?: number, sort?: any, include?: string | string[]): Promise<(Document & E)[]> {
    try {
      let q = this.model.find(query);

      if (sort) {
        q = q.sort(sort);
      }

      if (page && pageSize) {
        q = q.skip((page - 1) * pageSize).limit(pageSize);
      }

      if (include) {
        let includes = Array.isArray(include) ? include.join(' ') : include;
        q = (<any>q).deepPopulate(includes);
      }

      let dbRecords = await q;
      return dbRecords;
    }
    catch(error) {
      throw this.handleError(error);
    }
  }

  /**
   * Returns total record count
   * 
   * @param {Object} query    
   * @returns {number}
   * 
   * @memberof Provider
   */
  async count(query: any): Promise<number> {
    try {
      query = query || {};

      let q = this.model.count(query);      

      let count = await q; 

      return count;
    }
    catch(error) {
      throw this.handleError(error);
    }
  } 

  /**
   * Returns distinct field values
   * 
   * @param {Object} query 
   * @returns {Object[]}
   * 
   * @memberof Provider
   */
  async distinct(query: any): Promise<(Document & E)[]> {
    try {
      query = query || {};

      let q = this.model.distinct(query);      

      let distinct = await q; 

      return distinct;
    }
    catch(error) {
      throw this.handleError(error);
    }
  }

  async aggregate(query: any): Promise<any[]> {
    try {
      query = query || {};

      let q = this.model.aggregate(query);

      let result = await q;

      return result;
    }
    catch(error) {
      throw this.handleError(error);
    }
  }
}