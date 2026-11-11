/**
 * Stand-in for twenty-front `ObjectRecord` (@/object-record/types/ObjectRecord): a record is an id plus arbitrary fields.
 * Upstream: twentyhq/twenty @ f5cfa249c9fa
 */
export type ObjectRecord = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [fieldName: string]: any;
};
