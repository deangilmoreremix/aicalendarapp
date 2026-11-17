import { describe, it, expect } from 'vitest';
import { filterRecords, matchGroup, matchRule, toNumber } from './match';
import { CONTACT_FIELDS, DEAL_FIELDS, FIELD_MAPS, TASK_FIELDS } from './fields';
import type { FilterGroup, FilterRule } from './types';

const now = new Date(2026, 10, 16, 15);
let n = 0;
const rule = (field: string, operand: FilterRule['operand'], extra: Partial<FilterRule> = {}): FilterRule => ({ id: `r${n++}`, field, operand, ...extra });
const field = <_T,>(defs: any[], key: string) => defs.find((d) => d.key === key);
const t = (over: any = {}) => ({ id: '1', title: 'Send proposal to TechCorp', status: 'pending', priority: 'high', type: 'proposal', tags: ['sales', 'q4'], completed: false, ...over });

describe('text operands', () => {
  const d = field(TASK_FIELDS, 'title');
  it.each([
    ['contains', 'proposal', true], ['contains', 'PROPOSAL', true], ['contains', 'nope', false],
    ['not_contains', 'nope', true], ['not_contains', 'proposal', false],
    ['is', 'send proposal to techcorp', true], ['is', 'send', false],
    ['is_not', 'send', true], ['starts_with', 'send', true], ['starts_with', 'proposal', false]
  ] as const)('%s "%s" -> %s', (op, value, expected) => {
    expect(matchRule(rule('title', op, { value }), t(), d, now)).toBe(expected);
  });
  it('empty / not empty', () => {
    const e = field(TASK_FIELDS, 'description');
    expect(matchRule(rule('description', 'is_empty'), t(), e)).toBe(true);
    expect(matchRule(rule('description', 'is_empty'), t({ description: '' }), e)).toBe(true);
    expect(matchRule(rule('description', 'is_not_empty'), t({ description: 'x' }), e)).toBe(true);
  });
  it('a rule with no value yet does not filter anything out', () => {
    expect(matchRule(rule('title', 'contains', { value: '' }), t(), field(TASK_FIELDS, 'title'))).toBe(true);
  });
});

describe('number operands (currency strings count)', () => {
  const d = field(DEAL_FIELDS, 'value');
  const deal = (value: string) => ({ value });
  it('parses "$85,000"', () => {
    expect(toNumber('$85,000')).toBe(85000);
    expect(toNumber('abc')).toBeNull();
  });
  it.each([
    ['gt', '50000', '$85,000', true], ['gt', '90000', '$85,000', false], ['lt', '90000', '$85,000', true],
    ['eq', '85000', '$85,000', true], ['neq', '85000', '$85,000', false]
  ] as const)('%s %s on %s -> %s', (op, value, v, expected) => {
    expect(matchRule(rule('value', op, { value }), deal(v), d)).toBe(expected);
  });
  it('between is inclusive and order-insensitive', () => {
    expect(matchRule(rule('value', 'between', { value: '100000', value2: '50000' }), deal('$85,000'), d)).toBe(true);
    expect(matchRule(rule('value', 'between', { value: '90000', value2: '100000' }), deal('$85,000'), d)).toBe(false);
  });
  it('a non-numeric value only satisfies "not equal"', () => {
    expect(matchRule(rule('value', 'gt', { value: '1' }), deal('n/a'), d)).toBe(false);
    expect(matchRule(rule('value', 'neq', { value: '1' }), deal('n/a'), d)).toBe(true);
  });
});

describe('date operands', () => {
  const d = field(TASK_FIELDS, 'dueDate');
  const due = (date: Date | string | undefined) => ({ dueDate: date });
  it('today / before / after / is', () => {
    expect(matchRule(rule('dueDate', 'today'), due(new Date(2026, 10, 16, 1)), d, now)).toBe(true);
    expect(matchRule(rule('dueDate', 'today'), due(new Date(2026, 10, 17)), d, now)).toBe(false);
    expect(matchRule(rule('dueDate', 'before', { value: '2026-11-16' }), due(new Date(2026, 10, 15, 23)), d, now)).toBe(true);
    expect(matchRule(rule('dueDate', 'after', { value: '2026-11-16' }), due(new Date(2026, 10, 16, 23)), d, now)).toBe(false);
    expect(matchRule(rule('dueDate', 'is', { value: '2026-11-16' }), due(new Date(2026, 10, 16, 9)), d, now)).toBe(true);
  });
  it('between, next N days, last N days', () => {
    expect(matchRule(rule('dueDate', 'between', { value: '2026-11-10', value2: '2026-11-20' }), due('2026-11-20'), d, now)).toBe(true);
    expect(matchRule(rule('dueDate', 'between', { value: '2026-11-10', value2: '2026-11-20' }), due('2026-11-21'), d, now)).toBe(false);
    expect(matchRule(rule('dueDate', 'next_n_days', { value: '7' }), due(new Date(2026, 10, 23)), d, now)).toBe(true);
    expect(matchRule(rule('dueDate', 'next_n_days', { value: '7' }), due(new Date(2026, 10, 24)), d, now)).toBe(false);
    expect(matchRule(rule('dueDate', 'next_n_days', { value: '7' }), due(new Date(2026, 10, 15)), d, now)).toBe(false);
    expect(matchRule(rule('dueDate', 'last_n_days', { value: '3' }), due(new Date(2026, 10, 13)), d, now)).toBe(true);
  });
  it('a record without a date never matches a date comparison, but is "empty"', () => {
    expect(matchRule(rule('dueDate', 'before', { value: '2026-12-01' }), due(undefined), d, now)).toBe(false);
    expect(matchRule(rule('dueDate', 'is_empty'), due(undefined), d, now)).toBe(true);
  });
});

describe('select, multiselect and boolean', () => {
  it('select is / is not / is any of', () => {
    const d = field(TASK_FIELDS, 'status');
    expect(matchRule(rule('status', 'is', { value: 'pending' }), t(), d)).toBe(true);
    expect(matchRule(rule('status', 'is_not', { value: 'pending' }), t(), d)).toBe(false);
    expect(matchRule(rule('status', 'is_any_of', { values: ['completed', 'pending'] }), t(), d)).toBe(true);
    expect(matchRule(rule('status', 'is_any_of', { values: ['completed'] }), t(), d)).toBe(false);
  });
  it('multiselect has any / has all', () => {
    const d = field(TASK_FIELDS, 'tags');
    expect(matchRule(rule('tags', 'contains_any', { values: ['q4', 'x'] }), t(), d)).toBe(true);
    expect(matchRule(rule('tags', 'contains_all', { values: ['q4', 'x'] }), t(), d)).toBe(false);
    expect(matchRule(rule('tags', 'contains_all', { values: ['q4', 'sales'] }), t(), d)).toBe(true);
    expect(matchRule(rule('tags', 'is_empty'), t({ tags: [] }), d)).toBe(true);
  });
  it('boolean yes / no', () => {
    const d = field(TASK_FIELDS, 'completed');
    expect(matchRule(rule('completed', 'is_false'), t(), d)).toBe(true);
    expect(matchRule(rule('completed', 'is_true'), t({ completed: true }), d)).toBe(true);
    expect(matchRule(rule('completed', 'is_true'), t(), d)).toBe(false);
  });
});

describe('groups', () => {
  const rows = [t({ id: 'a', status: 'pending', priority: 'high' }), t({ id: 'b', status: 'completed', priority: 'high' }), t({ id: 'c', status: 'pending', priority: 'low' })];
  const group = (op: 'and' | 'or'): FilterGroup => ({ op, rules: [rule('status', 'is', { value: 'pending' }), rule('priority', 'is', { value: 'high' })] });
  it('AND needs every rule, OR needs any', () => {
    expect(filterRecords(rows, group('and'), FIELD_MAPS.task).map((r) => r.id)).toEqual(['a']);
    expect(filterRecords(rows, group('or'), FIELD_MAPS.task).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
  it('no rules (or rules for unknown fields) keep everything', () => {
    expect(filterRecords(rows, { op: 'and', rules: [] }, FIELD_MAPS.task)).toHaveLength(3);
    expect(matchGroup({ op: 'and', rules: [rule('nope', 'is', { value: 'x' })] }, rows[0], FIELD_MAPS.task)).toBe(true);
    expect(filterRecords(rows, undefined, FIELD_MAPS.task)).toHaveLength(3);
  });
  it('works on contacts too', () => {
    const contacts = [{ name: 'Ada', status: 'lead', aiScore: 82, tags: ['vip'] }, { name: 'Grace', status: 'customer', aiScore: 40, tags: [] }] as any[];
    expect(filterRecords(contacts, { op: 'and', rules: [rule('aiScore', 'gt', { value: '60' }), rule('tags', 'contains_any', { values: ['vip'] })] }, FIELD_MAPS.contact).map((c) => c.name)).toEqual(['Ada']);
    expect(CONTACT_FIELDS.find((f) => f.key === 'aiScore')!.type).toBe('number');
  });
});
