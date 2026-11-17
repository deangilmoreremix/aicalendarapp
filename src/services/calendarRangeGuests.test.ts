import { describe, it, expect, vi } from 'vitest';

const rows = vi.hoisted(() => ({
  events: [{ id: 'e1', title: 'Kickoff', start_date: '2031-01-05T10:00:00Z', end_date: '2031-01-05T11:00:00Z', is_all_day: false }],
  guests: [{ calendar_event_id: 'e1', handle: 'ada@x.io', display_name: 'Ada Lovelace', contact_id: 'c1' }]
}));

vi.mock('../lib/supabase', () => {
  const chain = (data: unknown[]) => {
    const q: any = { select: () => q, lte: () => q, or: () => q, in: () => q, order: () => Promise.resolve({ data, error: null }) };
    q.then = (res: (v: unknown) => unknown) => Promise.resolve({ data, error: null }).then(res);
    return q;
  };
  return { supabase: { from: (table: string) => chain(table === 'calendar_events' ? rows.events : rows.guests) } };
});

import { calendarEventApi } from './api';

describe('calendarEventApi.getRange', () => {
  it('attaches the saved guests of each event', async () => {
    const [event] = await calendarEventApi.getRange(new Date(2031, 0, 1), new Date(2031, 0, 31));
    expect(event.participants).toEqual([{ firstName: '', lastName: '', displayName: 'Ada Lovelace', handle: 'ada@x.io', personId: 'c1' }]);
  });
});
