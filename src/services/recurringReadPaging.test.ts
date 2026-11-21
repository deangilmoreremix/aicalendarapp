import { describe, it, expect, vi, beforeEach } from 'vitest';

const fake = vi.hoisted(() => ({ ranges: [] as number[][], pages: [] as unknown[][], orders: [] as string[] }));
vi.mock('../lib/supabase', () => {
  const q = (table: string): any => {
    const o: any = {
      select: () => o, lte: () => o, or: () => o, not: () => o, in: () => o, order: (col: string) => { fake.orders.push(col); return o; },
      range: (a: number, b: number) => { fake.ranges.push([a, b]); return Promise.resolve({ data: fake.pages.shift() ?? [], error: null }); },
      then: (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res)
    };
    return table === 'calendar_events' ? o : { ...o };
  };
  return { supabase: { from: (t: string) => q(t) } };
});
import { calendarEventApi } from './api';

const row = (i: number) => ({ id: `s${i}`, title: 't', start_date: '2020-01-01T09:00:00Z', end_date: '2020-01-01T10:00:00Z', is_all_day: false, recurrence_rule: 'FREQ=YEARLY' });

describe('calendarEventApi.getRange reads series page by page', () => {
  beforeEach(() => { fake.ranges = []; fake.orders = []; });
  it('keeps reading while a page is full, so old series cannot hide newer ones behind the row cap', async () => {
    fake.pages = [Array.from({ length: 1000 }, (_, i) => row(i)), [row(1000)]];
    const events = await calendarEventApi.getRange(new Date(2031, 0, 1), new Date(2031, 0, 31));
    expect(fake.orders).toContain('id'); // a unique order, so equal start dates cannot repeat or skip rows between pages
    expect(fake.ranges).toEqual([[0, 999], [1000, 1999]]);
    expect(new Set(events.map((e) => e.seriesId)).size).toBe(1001);
  });

  it('fails instead of silently dropping series when the page limit is reached', async () => {
    fake.pages = Array.from({ length: 300 }, (_, p) => Array.from({ length: 1000 }, (_, i) => row(p * 1000 + i)));
    await expect(calendarEventApi.getRange(new Date(2031, 0, 1), new Date(2031, 0, 31))).rejects.toThrow(/Too many/);
  });
});
