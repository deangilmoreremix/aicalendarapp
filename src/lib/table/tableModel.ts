/** Pure table logic: cell text, sorting, searching, paging. Ours (glue). */
import { toNumber } from '../recordFilters/match';
import type { FieldDef } from '../recordFilters/types';

export type SortState = { key?: string; dir?: 'asc' | 'desc' };

export const DEFAULT_COLUMNS = {
  contact: ['name', 'company', 'email', 'status', 'aiScore', 'nextFollowUp', 'isFavorite'],
  deal: ['company', 'title', 'value', 'stage', 'priority', 'dueDate', 'isFavorite'],
  task: ['title', 'status', 'priority', 'dueDate', 'assignedUserName', 'isFavorite']
} as const;

const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const cellText = <T,>(def: FieldDef<T>, record: T): string => {
  const v = def.get(record);
  if (v === undefined || v === null || v === '') return '';
  if (v instanceof Date) return isNaN(+v) ? '' : fmtDate(v);
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (def.type === 'select') return String(v).replace(/-/g, ' ');
  return String(v);
};

const sortKey = <T,>(def: FieldDef<T>, record: T): number | string | null => {
  const v = def.get(record);
  if (v === undefined || v === null || v === '') return null;
  if (v instanceof Date) return isNaN(+v) ? null : +v;
  if (def.type === 'date') {
    const d = new Date(String(v));
    return isNaN(+d) ? null : +d;
  }
  if (def.type === 'number') return toNumber(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (Array.isArray(v)) return v.join(', ').toLowerCase();
  return String(v).toLowerCase();
};

/** Records without a value always sort last, whichever direction is chosen. */
export const sortRecords = <T,>(records: T[], defs: Record<string, FieldDef<T>>, sort: SortState): T[] => {
  const def = sort.key ? defs[sort.key] : undefined;
  if (!def || !sort.dir) return records;
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...records].sort((a, b) => {
    const x = sortKey(def, a);
    const y = sortKey(def, b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
    return String(x).localeCompare(String(y)) * dir;
  });
};

/** click cycle: ascending -> descending -> none */
export const nextSort = (current: SortState, key: string): SortState =>
  current.key !== key ? { key, dir: 'asc' } : current.dir === 'asc' ? { key, dir: 'desc' } : {};

export const searchRows = <T,>(records: T[], defs: FieldDef<T>[], term: string): T[] => {
  const q = term.trim().toLowerCase();
  if (!q) return records;
  return records.filter((r) => defs.some((d) => d.type !== 'boolean' && cellText(d, r).toLowerCase().includes(q)));
};

export const paginate = <T,>(records: T[], page: number, pageSize: number) => {
  const pages = Math.max(1, Math.ceil(records.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: records.slice((current - 1) * pageSize, current * pageSize), page: current, pages, total: records.length };
};
