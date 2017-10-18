export interface IPasswordRequirements {
  minLength: number;
  mixedCaseRequired: boolean;
  numberRequired: boolean;
}

export interface IConstants {
  googleTokenAuth: string;
  passwordRequirements: IPasswordRequirements;
}