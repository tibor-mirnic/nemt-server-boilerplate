export interface ISchemaIndex {
  fields: any;
  options?: {
    expires?: string;
    [other: string]: any;
  };
}
