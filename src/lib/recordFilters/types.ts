/**
 * Record filters with operators (Twenty: object-record/record-filter). Operand names and their meaning follow
 * Twenty's (contains, is, is not, is empty, greater/less than, before/after/between, ...). Ours (glue): the matcher
 * runs over this app's typed records; Twenty's runs over GraphQL/metadata-driven records.
 */
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';

export type Operand =
  | 'contains' | 'not_contains' | 'is' | 'is_not' | 'starts_with'
  | 'eq' | 'neq' | 'gt' | 'lt' | 'between'
  | 'before' | 'after' | 'today' | 'next_n_days' | 'last_n_days'
  | 'is_any_of' | 'contains_any' | 'contains_all'
  | 'is_true' | 'is_false'
  | 'is_empty' | 'is_not_empty';

export const OPERANDS_BY_TYPE: Record<FieldType, Operand[]> = {
  text: ['contains', 'not_contains', 'is', 'is_not', 'starts_with', 'is_empty', 'is_not_empty'],
  number: ['eq', 'neq', 'gt', 'lt', 'between', 'is_empty', 'is_not_empty'],
  date: ['is', 'before', 'after', 'between', 'today', 'next_n_days', 'last_n_days', 'is_empty', 'is_not_empty'],
  select: ['is', 'is_not', 'is_any_of', 'is_empty', 'is_not_empty'],
  multiselect: ['contains_any', 'contains_all', 'is_empty', 'is_not_empty'],
  boolean: ['is_true', 'is_false']
};

export const OPERAND_LABEL: Record<Operand, string> = {
  contains: 'contains', not_contains: 'does not contain', is: 'is', is_not: 'is not', starts_with: 'starts with',
  eq: '=', neq: '≠', gt: '>', lt: '<', between: 'between',
  before: 'before', after: 'after', today: 'is today', next_n_days: 'in the next … days', last_n_days: 'in the last … days',
  is_any_of: 'is any of', contains_any: 'has any of', contains_all: 'has all of',
  is_true: 'is yes', is_false: 'is no',
  is_empty: 'is empty', is_not_empty: 'is not empty'
};

/** operands that take no value */
export const VALUELESS: Operand[] = ['today', 'is_empty', 'is_not_empty', 'is_true', 'is_false'];

export interface FilterRule {
  id: string;
  field: string;
  operand: Operand;
  /** text / number / date (yyyy-mm-dd) / single select value / number of days */
  value?: string;
  /** second bound for "between" */
  value2?: string;
  /** several choices for select "is any of" and multiselect operands */
  values?: string[];
}

export interface FilterGroup {
  op: 'and' | 'or';
  rules: FilterRule[];
}

export const emptyGroup = (): FilterGroup => ({ op: 'and', rules: [] });

export interface FieldDef<T> {
  key: string;
  label: string;
  type: FieldType;
  /** the raw value to test: string | number | boolean | Date | string[] | undefined */
  get: (record: T) => unknown;
  options?: { value: string; label: string }[];
}
