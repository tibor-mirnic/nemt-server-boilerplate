import { IReportColumn } from './../reports/column';

export interface IReport {
  id?: any;
  type: string;
  name: string;
  columns: IReportColumn[];
  filter: any;
  data: any;
}