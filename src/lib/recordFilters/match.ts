import { VALUELESS, type FieldDef, type FilterGroup, type FilterRule } from './types';

const isEmptyValue = (v: unknown) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const DAY = 86_400_000;

const toDate = (v: unknown): Date | null => {
  if (v instanceof Date) return isNaN(+v) ? null : v;
  if (typeof v === 'string' && v) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
    return isNaN(+d) ? null : d;
  }
  return null;
};

/** "$85,000" -> 85000; "85%" -> 85; non-numeric -> null */
export const toNumber = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const norm = (s: unknown) => String(s ?? '').toLowerCase();

/** Does `record` satisfy one rule? A rule whose value is still blank matches everything (it is being typed). */
export const matchRule = <T>(rule: FilterRule, record: T, def: FieldDef<T>, now: Date = new Date()): boolean => {
  const raw = def.get(record);
  const { operand } = rule;

  if (operand === 'is_empty') return isEmptyValue(raw);
  if (operand === 'is_not_empty') return !isEmptyValue(raw);
  if (operand === 'is_true') return raw === true;
  if (operand === 'is_false') return raw !== true;

  const needsValue = !VALUELESS.includes(operand);
  const blank = (rule.value === undefined || rule.value === '') && !(rule.values && rule.values.length);
  if (needsValue && blank) return true;

  switch (def.type) {
    case 'text': {
      const a = norm(raw);
      const b = norm(rule.value);
      if (operand === 'contains') return a.includes(b);
      if (operand === 'not_contains') return !a.includes(b);
      if (operand === 'is') return a === b;
      if (operand === 'is_not') return a !== b;
      if (operand === 'starts_with') return a.startsWith(b);
      return true;
    }
    case 'number': {
      const n = toNumber(raw);
      const x = toNumber(rule.value);
      if (n === null || x === null) return operand === 'neq';
      if (operand === 'eq') return n === x;
      if (operand === 'neq') return n !== x;
      if (operand === 'gt') return n > x;
      if (operand === 'lt') return n < x;
      if (operand === 'between') {
        const y = toNumber(rule.value2);
        return y === null ? n >= x : n >= Math.min(x, y) && n <= Math.max(x, y);
      }
      return true;
    }
    case 'date': {
      const d = toDate(raw);
      if (!d) return false;
      const day = startOfDay(d);
      const today = startOfDay(now);
      if (operand === 'today') return day === today;
      if (operand === 'next_n_days') {
        const n = toNumber(rule.value) ?? 0;
        return day >= today && day <= today + n * DAY;
      }
      if (operand === 'last_n_days') {
        const n = toNumber(rule.value) ?? 0;
        return day <= today && day >= today - n * DAY;
      }
      const x = toDate(rule.value);
      if (!x) return true;
      if (operand === 'is') return day === startOfDay(x);
      if (operand === 'before') return day < startOfDay(x);
      if (operand === 'after') return day > startOfDay(x);
      if (operand === 'between') {
        const y = toDate(rule.value2);
        const lo = startOfDay(x);
        const hi = y ? startOfDay(y) : Infinity;
        return day >= Math.min(lo, hi) && day <= Math.max(lo, hi);
      }
      return true;
    }
    case 'select': {
      const a = norm(raw);
      if (operand === 'is') return a === norm(rule.value);
      if (operand === 'is_not') return a !== norm(rule.value);
      if (operand === 'is_any_of') return (rule.values ?? []).some((v) => norm(v) === a);
      return true;
    }
    case 'multiselect': {
      const have = (Array.isArray(raw) ? raw : []).map(norm);
      const want = (rule.values ?? []).map(norm);
      if (operand === 'contains_any') return want.some((w) => have.includes(w));
      if (operand === 'contains_all') return want.every((w) => have.includes(w));
      return true;
    }
    default:
      return true;
  }
};

/** AND: every rule must match; OR: any rule. No rules matches everything. */
export const matchGroup = <T>(group: FilterGroup | undefined, record: T, defs: Record<string, FieldDef<T>>, now?: Date): boolean => {
  const rules = (group?.rules ?? []).filter((r) => defs[r.field]);
  if (rules.length === 0) return true;
  const test = (r: FilterRule) => matchRule(r, record, defs[r.field], now);
  return group!.op === 'or' ? rules.some(test) : rules.every(test);
};

export const filterRecords = <T>(records: T[], group: FilterGroup | undefined, defs: Record<string, FieldDef<T>>, now?: Date): T[] =>
  group && group.rules.length ? records.filter((r) => matchGroup(group, r, defs, now)) : records;

export const countActiveRules = (group?: FilterGroup) => (group?.rules ?? []).length;
