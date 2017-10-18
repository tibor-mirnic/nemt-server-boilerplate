import * as passport from 'passport';
import { Strategy as Local } from 'passport-local';
import { Strategy as Bearer } from 'passport-http-bearer';

import { Document } from 'mongoose';

import { Server } from './../server';
import { IRequest } from './../models/express/request';
import { IPassportInfo } from './../models/passport';
import { AuthenticationError } from './../error/auth';
import { ForbiddenError } from './../error/forbidden';
import { Util } from './../util/util';
import { GoogleUtil } from './../util/google';

import { UserProvider } from './../../providers/user';
import { IUser } from './../../db/models/user/user';

import { TokenProvider } from './../../providers/token';
import { IToken } from './../../db/models/token/token';

export class PassportStrategies {
  server: Server;
  userProvider: UserProvider;
  tokenProvider: TokenProvider;

  constructor(server: Server) {
    this.server = server;

    this.userProvider = new UserProvider(this.server, this.server.systemUserId);
    this.tokenProvider = new TokenProvider(server);

    this.build();
  }

  build() {
    passport.use('local', new Local (
      { usernameField: 'email', passReqToCallback: true},
      this.local.bind(this)
    ));    

    passport.use('bearer', new Bearer(      
      this.bearer.bind(this)
    ));

    passport.use('bearer-invite', new Bearer(      
      this.bearerInvite.bind(this)
    ));

    passport.use('bearer-onboard', new Bearer(      
      this.bearerOnboard.bind(this)
    ));

    // admin part
    passport.use('local-internal', new Local(
      { usernameField: 'email', passReqToCallback: true},
      this.localInternal.bind(this)
    ));

    passport.use('bearer-internal', new Bearer(      
      this.bearerInternal.bind(this)
    ));
  }

  async local(request: IRequest, email: string, password: string, done: (err: any, user?: Document & IUser, info?: IPassportInfo) => void) {
    try {
      if (!email || !password) {
        throw new AuthenticationError('Missing email or password fields!');
      }

      let dbUser = await this.userProvider.findOne({
        'email': email,
        'customer': { 'status': 'active' },
        'isDeleted': false
      }, [
        'role',
        'customer.organization',
        'customer.accessRights.instance'
      ]);

      if(!dbUser) {
        throw new AuthenticationError('Access credentials are incorrect!');
      }

      if(request.body.googleLogin) {
        let data: any = await GoogleUtil.validateToken(password, this.server.environment.googleConfiguration.clientId, this.server.constants.googleTokenAuth);

        if(data.email && data.email !== email) {
          throw new AuthenticationError('Login email mismatch!');
        }
      }
      else if(!Util.compareHash(password, dbUser.passwordHash)) {
        throw new AuthenticationError('Access credentials are incorrect!');
      }      

      return done(null, dbUser);
    }
    catch(error) {
      done(error);
    }
  }

  async bearer(token: string, done: (err: any, user?: Document & IUser, info?: IPassportInfo) => void) {
    try {
      let errorObj = new ForbiddenError('Unauthorized!');

      if(typeof(token) === 'undefined' || token === '') {
        throw errorObj;
      }

      let dbToken = await this.tokenProvider.findOne({
        'token': token,
        'type': { $in: ['access', 'admin'] }
      });

      if(!dbToken) {
        throw errorObj;
      }

      if(!dbToken.user) {
        throw errorObj;
      }

      let includes = [
        'role'
      ];
      
      if(dbToken.type === 'access') {
        includes.push('customer.organization');
        includes.push('customer.accessRights.instance');
      }

      let dbUser = await this.userProvider.findOne({
        '_id': dbToken.user.toString(),
        'customer': { 'status': 'active' },
        'isDeleted': false
      }, includes);

      if(!dbUser) {
        throw errorObj;
      }

      return done(null, dbUser, {
        token: token
      });
    }
    catch(error) {
      done(error);
    }
  }

  async bearerInvite(token: string, done: (err: any, user?: Document & IUser, info?: IPassportInfo) => void) {
    try {
      let errorObj = new ForbiddenError('Unauthorized!');

      if(typeof(token) === 'undefined' || token === '') {
        throw errorObj;
      }

      let dbToken = await this.tokenProvider.findOne({
        'token': token,
        'type': 'register'
      });

      if(!dbToken) {
        throw errorObj;
      }

      if(!dbToken.user) {
        throw errorObj;
      }

      let dbUser = await this.userProvider.findOne({
        '_id': dbToken.user.toString(),
        'customer': {
          'status': 'invited'
        },
        'isDeleted': false
      }, [
        'role',
        'customer.organization',
        'customer.accessRights.instance'
      ]);

      if(!dbUser) {
        throw errorObj;
      }

      return done(null, dbUser, {
        token: token
      });
    }
    catch(error) {
      done(error);
    }
  }

  async bearerOnboard(token: string, done: (err: any, user?: Document & IToken, info?: IPassportInfo) => void) {
    try {
      let errorObj = new ForbiddenError('Unauthorized!');

      if(typeof(token) === 'undefined' || token === '') {
        throw errorObj;
      }

      let dbToken = await this.tokenProvider.findOne({
        'token': token,
        'type': 'onboard'
      });

      if(!dbToken) {
        throw errorObj;
      }      

      return done(null, dbToken);
    }
    catch(error) {
      done(error);
    }
  }

  async localInternal(request: IRequest, email: string, password: string, done: (err: any, user?: Document & IUser, info?: IPassportInfo) => void) {
    try {
      if (!email || !password) {
        throw new AuthenticationError('Missing email or password fields!');
      }

      let dbUser = await this.userProvider.findOne({
        'email': email,
        'isDeleted': false        
      }, 'role');

      if(!dbUser) {
        throw new AuthenticationError('Access credentials are incorrect!');
      }

      if(!Util.compareHash(password, dbUser.passwordHash)) {
        throw new AuthenticationError('Access credentials are incorrect!');
      }      

      return done(null, dbUser);
    }
    catch(error) {
      done(error);
    }
  }

  async bearerInternal(token: string, done: (err: any, user?: Document & IUser, info?: IPassportInfo) => void) {
    try {
      let errorObj = new ForbiddenError('Unauthorized!');

      if(typeof(token) === 'undefined' || token === '') {
        throw errorObj;
      }

      let dbToken = await this.tokenProvider.findOne({
        'token': token,
        'type': 'admin'
      });

      if(!dbToken) {
        throw errorObj;
      }

      if(!dbToken.user) {
        throw errorObj;
      }

      let dbUser = await this.userProvider.findOne({
        '_id': dbToken.user.toString(),        
        'isDeleted': false
      }, 'role');

      if(!dbUser) {
        throw errorObj;
      }

      return done(null, dbUser, {
        token: token
      });
    }
    catch(error) {
      done(error);
    }
  }
}