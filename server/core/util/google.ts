import * as request from 'request-promise-native';

import { GoogleAuthenticationError } from '../error/auth';

export class GoogleUtil {

  static async validateToken(authUrl: string, tokenId: string, clientId: string) {
    try {
      const result = await request({
        url: authUrl,
        method: 'GET',
        json: true,
        qs: {
          id_token: tokenId
        }
      });

      if (!result.aud || !result.aud.includes(clientId)) {
        throw new GoogleAuthenticationError('Access credentials are incorrect!');
      }

      return result;
    } catch (error) {
      throw new GoogleAuthenticationError((error || '').toString());
    }
  }
}
