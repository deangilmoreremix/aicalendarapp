import { describe, it, expect, vi, beforeEach } from 'vitest';

const fake = vi.hoisted(() => ({
  calls: [] as { table: string; method: string; args: unknown[] }[],
  results: {} as Record<string, { data: unknown; error: unknown }>,
  rpc: { data: null as unknown, error: null as unknown }
}));

vi.mock('../lib/supabase', () => {
  const builder = (table: string) => {
    const q: any = new Proxy(
      {},
      {
        get: (_t, method: string) => {
          if (method === 'then') return (res: (v: unknown) => unknown) => Promise.resolve(fake.results[table] ?? { data: [], error: null }).then(res);
          return (...args: unknown[]) => {
            fake.calls.push({ table, method, args });
            return q;
          };
        }
      }
    );
    return q;
  };
  return { supabase: { from: builder, rpc: async () => fake.rpc } };
});

import { calendarEventApi, calendarBlocklistApi } from './api';

const ev = (id: string) => ({ id, title: id, start_date: '2031-01-05T10:00:00Z', end_date: '2031-01-05T11:00:00Z', is_all_day: false });
const range = () => calendarEventApi.getRange(new Date(2031, 0, 1), new Date(2031, 0, 31));

beforeEach(() => {
  fake.calls = [];
  fake.results = {};
  fake.rpc = { data: null, error: null };
});

describe('calendar blocklist', () => {
  it('adds a trimmed, lower-case handle and ignores duplicates', async () => {
    await calendarBlocklistApi.add('  Ada@Example.COM ');
    const [upsert] = fake.calls.filter((c) => c.table === 'calendar_blocklist' && c.method === 'upsert');
    expect(upsert.args[0]).toEqual({ handle: 'ada@example.com' });
    expect(upsert.args[1]).toMatchObject({ ignoreDuplicates: true });
  });

  it('ignores an empty entry', async () => {
    await calendarBlocklistApi.add('   ');
    expect(fake.calls).toHaveLength(0);
  });

  it('hides events with a blocked address or a blocked domain from the calendar', async () => {
    fake.results.calendar_blocklist = { data: [{ id: 'b1', handle: 'spam@x.io' }, { id: 'b2', handle: '@evil.com' }], error: null };
    await calendarBlocklistApi.remove('none'); // drops the cache so the list above is read
    fake.results.calendar_events = { data: [ev('keep'), ev('addr'), ev('domain'), ev('sub')], error: null };
    fake.results.calendar_event_participants = {
      data: [
        { calendar_event_id: 'keep', handle: 'ada@good.com', display_name: '', contact_id: null },
        { calendar_event_id: 'addr', handle: 'SPAM@x.io', display_name: '', contact_id: null },
        { calendar_event_id: 'domain', handle: 'bob@evil.com', display_name: '', contact_id: null },
        { calendar_event_id: 'sub', handle: 'bob@mail.evil.com', display_name: '', contact_id: null }
      ],
      error: null
    };
    const events = await range();
    expect(events.map((e) => e.id)).toEqual(['keep']);
  });

  it('still shows everything when the blocklist cannot be read', async () => {
    await calendarBlocklistApi.remove('none'); // drops the cache
    fake.results.calendar_blocklist = { data: null, error: new Error('down') };
    fake.results.calendar_events = { data: [ev('a')], error: null };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await range()).map((e) => e.id)).toEqual(['a']);
  });

  it('hides blocked events from a record timeline and lowers the total', async () => {
    fake.results.calendar_blocklist = { data: [{ id: 'b1', handle: '@evil.com' }], error: null };
    await calendarBlocklistApi.remove('none');
    fake.rpc = {
      data: {
        totalNumberOfCalendarEvents: 2,
        timelineCalendarEvents: [
          { id: 'a', title: 'ok', isFullDay: false, startsAt: '2031-01-05T10:00:00Z', participants: [{ handle: 'ada@good.com', displayName: 'Ada' }] },
          { id: 'b', title: 'bad', isFullDay: false, startsAt: '2031-01-06T10:00:00Z', participants: [{ handle: 'bob@evil.com', displayName: 'Bob' }] }
        ]
      },
      error: null
    };
    const result = await calendarEventApi.getTimeline('contact', 'c1');
    expect(result.timelineCalendarEvents.map((e) => e.id)).toEqual(['a']);
    expect(result.totalNumberOfCalendarEvents).toBe(1);
  });
});

describe('event text and time zone', () => {
  it('strips control characters and falls back to UTC when the time zone is empty', async () => {
    fake.results.calendar_events = { data: { id: 'e1' }, error: null };
    await calendarEventApi.create({
      title: 'Bad\u0000title',
      description: 'ok',
      location: '',
      startsAt: '2031-01-05T10:00:00Z',
      endsAt: '2031-01-05T11:00:00Z',
      isFullDay: false,
      timeZone: '',
      visibility: 'SHARE_EVERYTHING',
      attendees: [],
      targets: []
    } as any);
    const [insert] = fake.calls.filter((c) => c.table === 'calendar_events' && c.method === 'insert');
    expect(insert.args[0]).toMatchObject({ title: 'Badtitle', time_zone: 'UTC' });
  });
});
