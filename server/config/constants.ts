import { IConstants } from '../core/models/constants';

export const constants: IConstants = {
  googleTokenAuth: 'some url',
  passwordRequirements: {
    minLength: 8,
    mixedCaseRequired: true,
    numberRequired: true
  },
  auditLogOperations: [
    'CREATE',
    'UPDATE',
    'DELETE',
    'HARD_DELETE',
    'EXTERNAL'
  ]
};
