import { describe, it, expect, vi, beforeEach } from 'vitest';

const rows = vi.hoisted(() => ({
  events: [] as any[],
  guests: [] as any[],
  guestQueries: [] as string[][]
}));

vi.mock('../lib/supabase', () => {
  const chain = (table: string) => {
    let ids: string[] = [];
    const q: any = {
      select: () => q,
      lte: () => q,
      or: () => q,
      in: (_col: string, list: string[]) => {
        ids = list;
        rows.guestQueries.push(list);
        return q;
      },
      order: () => Promise.resolve({ data: rows.events, error: null })
    };
    q.then = (res: (v: unknown) => unknown) =>
      Promise.resolve({ data: table === 'calendar_events' ? rows.events : rows.guests.filter((g) => ids.includes(g.calendar_event_id)), error: null }).then(res);
    return q;
  };
  return { supabase: { from: (table: string) => chain(table) } };
});

import { calendarEventApi } from './api';

const ev = (id: string) => ({ id, title: id, start_date: '2031-01-05T10:00:00Z', end_date: '2031-01-05T11:00:00Z', is_all_day: false });

describe('calendarEventApi.getRange', () => {
  beforeEach(() => {
    rows.events = [];
    rows.guests = [];
    rows.guestQueries = [];
  });

  it('attaches the saved guests of each event, and leaves events without guests alone', async () => {
    rows.events = [ev('e1'), ev('e2')];
    rows.guests = [{ calendar_event_id: 'e1', handle: 'ada@x.io', display_name: 'Ada Lovelace', contact_id: 'c1' }];
    const [first, second] = await calendarEventApi.getRange(new Date(2031, 0, 1), new Date(2031, 0, 31));
    expect(first.participants).toEqual([{ firstName: '', lastName: '', displayName: 'Ada Lovelace', handle: 'ada@x.io', personId: 'c1' }]);
    expect(second.participants).toBeUndefined();
  });

  it('does not query guests when there are no events', async () => {
    await calendarEventApi.getRange(new Date(2031, 0, 1), new Date(2031, 0, 31));
    expect(rows.guestQueries).toHaveLength(0);
  });

  it('loads guests in batches of 100 event ids', async () => {
    rows.events = Array.from({ length: 250 }, (_, i) => ev(`e${i}`));
    rows.guests = [{ calendar_event_id: 'e249', handle: 'z@x.io', display_name: '', contact_id: null }];
    const events = await calendarEventApi.getRange(new Date(2031, 0, 1), new Date(2031, 0, 31));
    expect(rows.guestQueries.map((q) => q.length)).toEqual([100, 100, 50]);
    expect(events[249].participants?.[0].displayName).toBe('z@x.io'); // falls back to the address
  });
});
