export interface IPasswordRequirements {
  minLength: number;
  mixedCaseRequired: boolean;
  numberRequired: boolean;
}

export interface IConstants {
  auditLogOperations: string[]
  googleTokenAuth: string;
  passwordRequirements: IPasswordRequirements;
}