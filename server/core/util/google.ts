import * as request from 'request';

import { GoogleAuthenticationError } from '../error/auth';

export class GoogleUtil {

  static validateToken(id_token: string, client_id: string, authUrl: string) {
    let requestOptions = {
      url: authUrl,
      method: 'GET',
      json: true,
      qs: {
        id_token: id_token
      }
    };

    return new Promise((resolve, reject) => {
      request(requestOptions, (error: any, response: any, body: any) => {
        if (error) {
          reject(new GoogleAuthenticationError((error || '').toString()));
        }

        if (!body.aud || !body.aud.includes(client_id)) {
          reject(new GoogleAuthenticationError('Access credentials are incorrect!'));
        }

        resolve(body);
      });
    });
  }
}
