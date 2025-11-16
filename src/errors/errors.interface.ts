export interface PostgresError {
  code: string;
  detail: string;
  table: string;
}
export interface GeneralError {
  code: string;
  message: string;
  stack: string;
}
