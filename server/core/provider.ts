import { Model, Document, DocumentQuery } from 'mongoose';

import { Logger } from './logger';
import { Util } from './util/util';
import { DatabaseError } from './error/server';
import { NotFoundError } from './error/not-found';
import { ITransformOptions } from './extensions/mongoose';
import { ProviderExtensions, Operation } from './extensions/provider';

import { IUser } from './../db/models/user/user';

export interface IMongooseDeepPopulateOptions {
  whitelist?: any[],
  populate?: any,
  rewrite?: any
}

export class Provider<E> {
  model: Model<Document & E>;
  userId?: string | null;
  logger?: Logger | null;

  constructor(model: Model<Document & E>, userId?: string | null) {
    this.model = model;
    this.userId = userId;
  }

  /**
   * Mongoose deepPopulate helper
   * 
   * @param {DocumentQuery} q 
   * @param {string|string[]} include 
   * @param {IMongooseDeepPopulateOptions} [override=undefined]
   * @returns {DocumentQuery}
   * 
   * @memberof Provider
   */
  deepPopulate(q: any, include?: string | string[], override?: IMongooseDeepPopulateOptions): any {
    let includes = Array.isArray(include) ? include.join(' ') : include;
    return (<any>q).deepPopulate(includes, Object.assign({}, override));
  }

  /**
   * Mongoose toJSON method override
   * 
   * @param {MongooseModel} dbRecord 
   * @param {string[]} excludeProps 
   * @param {Function} processRecord
   * @returns {MongooseModel}
   * 
   * @memberof Provider
   */
  transformObject(dbRecord: Document & E, options?: ITransformOptions<E>): E {
    if(options) {
      return <E>dbRecord.toJSON(options);
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
  transformObjects(dbRecords: (Document & E)[], options?: ITransformOptions<E>): E[] {
    return dbRecords.map((dbRecord: Document & E) => {
      return this.transformObject(dbRecord, options);
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
   * @param {IMongooseDeepPopulateOptions} [includeOptions=undefined]
   * @returns {MongooseModel}
   * 
   * @memberof Provider
   */
  async getById(id: string, include?: string | string[], includeOptions?: IMongooseDeepPopulateOptions): Promise<Document & E> {
    try {
      let q = this.model.findById(id);

      if (include) {
        q = <DocumentQuery<(Document & E) | null, Document & E>>this.deepPopulate(q, include, includeOptions);
      }

      let dbRecord = await q;

      if(!dbRecord) {
        throw new NotFoundError('Record not found!');
      }

      return dbRecord;
    }
    catch(error) {
      throw error;
    }
  }

  
  /**
   * Returns found record or undefined
   * 
   * @param {string} id 
   * @param {string|string[]} [include=undefined] 
   * @param {IMongooseDeepPopulateOptions} [includeOptions=undefined]
   * @returns {MongooseModel|undefined}
   * 
   * @memberof Provider
   */
  async findById(id: string, include?: string | string[], includeOptions?: IMongooseDeepPopulateOptions): Promise<Document & E | null> {
    try {      
      let dbRecord = await this.findOne({
        '_id': id
      }, include, includeOptions);      

      return dbRecord;
    }
    catch(error) {
      throw error;
    }
  }


  /**
   * Returns found record or undefined
   * 
   * @param {any} query 
   * @param {string|string[]} [include=undefined]
   * @param {IMongooseDeepPopulateOptions} [includeOptions=undefined]
   * @returns {MongooseModel|undefined}
   * 
   * @memberof Provider
   */
  async findOne(query: any, include?: string | string[], includeOptions?: IMongooseDeepPopulateOptions): Promise<Document & E | null> {
    try {
      query = query || {};

      let q = this.model.findOne(query);

      if (include) {
        q = <DocumentQuery<(Document & E) | null, Document & E>>this.deepPopulate(q, include, includeOptions);
      }

      let dbRecord = await q; 

      return dbRecord;
    }
    catch(error) {
      throw error;
    }
  }

  /**
   * Creates record
   * 
   * @param {Function} init - (record: MongooseModel) => void
   * @param {string|string[]} [include=undefined]
   * @param {IMongooseDeepPopulateOptions} [includeOptions=undefined]
   * @returns {MongooseModel}
   * 
   * @memberof Provider
   */
  async create(init: (record: Document & E) => void, include?: string | string[], includeOptions?: IMongooseDeepPopulateOptions): Promise<Document & E> { 
    try {
      let record = new this.model();

      if(init) {
        init(record);
      }

      if(this.userId) {
        record = ProviderExtensions.beforeSave(record, this.userId, Operation.CREATE);
      }
      
      await record.save();
      let dbRecord = await this.getById(record._id.toString(), include, includeOptions);
      return dbRecord;
    }
    catch(error) {
      throw error;
    }
  }

  /**
   * Updates record by id
   * 
   * @param {string} id 
   * @param {Function} update - (record: MongooseModel) => void
   * @param {string|string[]} [include=undefined]
   * @param {IMongooseDeepPopulateOptions} [includeOptions=undefined]
   * @returns {MoongooseModel}
   * 
   * @memberof Provider
   */
  async update(id: string, update: (record: Document & E) => void, include?: string | string[], includeOptions?: IMongooseDeepPopulateOptions): Promise<Document & E> { 
    try {
      let dbRecord = await this.getById(id);      
      
      if(update) {
        update(dbRecord);
      }

      if(this.userId) {
        dbRecord = ProviderExtensions.beforeSave(dbRecord, this.userId, Operation.UPDATE);
      }
      
      await dbRecord.save();
      let updatedRecord = await this.getById(dbRecord._id.toString(), include, includeOptions);
      return updatedRecord;      
    }
    catch(error) {
      throw error;
    }
  }

  /**
   * Soft deletes the record by id
   * 
   * @param {string} id 
   * @param {Function} [validate] - async (record: MongooseModel) => boolean
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
      throw error;
    }
  }

  /**
   * Hard deletes the record by id
   * 
   * @param {string} id 
   * @param {Function} [validate] - async (record: MongooseModel) => boolean
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
      throw error;
    }
  }

  /**
   * Hard deletes the record by query
   * 
   * @param {any} query   
   * 
   * @memberof Provider
   */
  async deleteHardByQuery(query: any): Promise<void> {
    try {
      let removedRecord = await this.model.findOneAndRemove(query);

      if(!removedRecord) {
        throw new NotFoundError('Record not found');
      }
    }
    catch(error) {
      throw error;
    }
  }
  

  /**
   * Query records
   * 
   * @param {any} [query]
   * @param {number} [page]
   * @param {number} [pageSize] 
   * @param {any} [sort]
   * @param {string|string[]} [include=undefined]
   * @param {IMongooseDeepPopulateOptions} [includeOptions=undefined]
   * @returns {MongooseModel[]}
   * 
   * @memberof Provider
   */
  async query(query = {}, page?: number, pageSize?: number, sort?: any, include?: string | string[], includeOptions?: IMongooseDeepPopulateOptions): Promise<(Document & E)[]> {
    try {
      let q = this.model.find(query);

      if (sort) {
        q = q.sort(sort);
      }

      if (page && pageSize) {
        q = q.skip((page - 1) * pageSize).limit(pageSize);
      }

      if (include) {
        q = <DocumentQuery<(Document & E)[], Document & E>>this.deepPopulate(q, include, includeOptions);
      }

      let dbRecords = await q;
      return dbRecords;
    }
    catch(error) {
      throw error;
    }
  }

  /**
   * Returns total record count
   * 
   * @param {any} query    
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
      throw error;
    }
  } 

  /**
   * Returns distinct field values
   * 
   * @param {any} query 
   * @returns {any[]}
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
      throw error;
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
      throw error;
    }
  }
}