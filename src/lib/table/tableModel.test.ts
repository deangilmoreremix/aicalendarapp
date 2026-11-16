import { describe, it, expect } from 'vitest';
import { cellText, nextSort, paginate, searchRows, sortRecords } from './tableModel';
import { CONTACT_FIELDS, DEAL_FIELDS, FIELD_MAPS, TASK_FIELDS } from '../recordFilters/fields';

describe('cellText', () => {
  it('formats by type', () => {
    const task: any = { title: 'x', status: 'in-progress', dueDate: new Date(2026, 10, 5), tags: ['a', 'b'], completed: true };
    const get = (key: string) => cellText(TASK_FIELDS.find((f) => f.key === key)!, task);
    expect(get('status')).toBe('in progress');
    expect(get('dueDate')).toBe('2026-11-05');
    expect(get('tags')).toBe('a, b');
    expect(get('completed')).toBe('Yes');
    expect(get('description')).toBe('');
  });
});

describe('sortRecords', () => {
  const deals: any[] = [{ company: 'B', value: '$9,000' }, { company: 'A', value: '$100,000' }, { company: 'C' }];
  it('sorts numbers numerically (not as text) and keeps empty values last in both directions', () => {
    expect(sortRecords(deals, FIELD_MAPS.deal, { key: 'value', dir: 'asc' }).map((d) => d.company)).toEqual(['B', 'A', 'C']);
    expect(sortRecords(deals, FIELD_MAPS.deal, { key: 'value', dir: 'desc' }).map((d) => d.company)).toEqual(['A', 'B', 'C']);
  });
  it('sorts text case-insensitively and leaves the order alone with no sort', () => {
    expect(sortRecords([{ name: 'b' }, { name: 'A' }] as any[], FIELD_MAPS.contact, { key: 'name', dir: 'asc' }).map((c: any) => c.name)).toEqual(['A', 'b']);
    expect(sortRecords(deals, FIELD_MAPS.deal, {})).toBe(deals);
  });
  it('sorts dates', () => {
    const tasks: any[] = [{ id: 1, dueDate: new Date(2026, 10, 9) }, { id: 2, dueDate: new Date(2026, 10, 1) }];
    expect(sortRecords(tasks, FIELD_MAPS.task, { key: 'dueDate', dir: 'asc' }).map((t) => t.id)).toEqual([2, 1]);
  });
});

describe('nextSort', () => {
  it('cycles asc, desc, none and restarts on a new column', () => {
    expect(nextSort({}, 'a')).toEqual({ key: 'a', dir: 'asc' });
    expect(nextSort({ key: 'a', dir: 'asc' }, 'a')).toEqual({ key: 'a', dir: 'desc' });
    expect(nextSort({ key: 'a', dir: 'desc' }, 'a')).toEqual({});
    expect(nextSort({ key: 'a', dir: 'desc' }, 'b')).toEqual({ key: 'b', dir: 'asc' });
  });
});

describe('searchRows and paginate', () => {
  const contacts: any[] = [{ name: 'Ada Lovelace', company: 'TechCorp', email: 'ada@x.io' }, { name: 'Grace', company: 'Globex', email: 'g@y.io' }];
  it('searches across visible text fields', () => {
    expect(searchRows(contacts, CONTACT_FIELDS, 'globex')).toHaveLength(1);
    expect(searchRows(contacts, CONTACT_FIELDS, '  ')).toHaveLength(2);
    expect(searchRows(contacts, DEAL_FIELDS as any, 'zzz')).toHaveLength(0);
  });
  it('pages and clamps out-of-range pages', () => {
    const rows = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(rows, 1, 10)).toMatchObject({ pages: 3, page: 1, total: 25 });
    expect(paginate(rows, 3, 10).rows).toHaveLength(5);
    expect(paginate(rows, 99, 10).page).toBe(3);
    expect(paginate([], 1, 10)).toMatchObject({ pages: 1, rows: [] });
  });
});
