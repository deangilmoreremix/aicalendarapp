import { describe, it, expect, vi, beforeEach } from 'vitest';

const fake = vi.hoisted(() => ({
  calls: [] as { table: string; method: string; args: unknown[] }[],
  results: {} as Record<string, { data: unknown; error: unknown }>,
  hold: undefined as Promise<void> | undefined, // makes reads wait, to stage a race
  rpc: { data: null as unknown, error: null as unknown },
  rpcCalls: [] as { name: string; args: any }[]
}));

vi.mock('../lib/supabase', () => {
  const builder = (table: string) => {
    const q: any = new Proxy(
      {},
      {
        get: (_t, method: string) => {
          if (method === 'then') return (res: (v: unknown) => unknown) => Promise.resolve(table === 'calendar_blocklist' ? fake.hold : undefined).then(() => fake.results[table] ?? { data: [], error: null }).then(res);
          return (...args: unknown[]) => {
            fake.calls.push({ table, method, args });
            return q;
          };
        }
      }
    );
    return q;
  };
  return { supabase: { from: builder, rpc: async (name: string, args: unknown) => { fake.rpcCalls.push({ name, args }); return fake.rpc; } } };
});

import { calendarEventApi, calendarBlocklistApi, invalidateBlocklistCache, BLOCKLIST_CACHE_MS } from './api';

const ev = (id: string) => ({ id, title: id, start_date: '2031-01-05T10:00:00Z', end_date: '2031-01-05T11:00:00Z', is_all_day: false });
const range = () => calendarEventApi.getRange(new Date(2031, 0, 1), new Date(2031, 0, 31));

beforeEach(() => {
  fake.calls = [];
  fake.results = {};
  fake.hold = undefined;
  fake.rpc = { data: null, error: null };
  fake.rpcCalls = [];
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

  it('returns a record timeline as the database function gave it (it already leaves blocked events out before paging)', async () => {
    fake.rpc = {
      data: {
        totalNumberOfCalendarEvents: 11,
        timelineCalendarEvents: [
          { id: 'a', title: 'ok', isFullDay: false, startsAt: '2031-01-05T10:00:00Z', participants: [{ handle: 'ada@good.com', displayName: 'Ada' }] }
        ]
      },
      error: null
    };
    const result = await calendarEventApi.getTimeline('contact', 'c1');
    expect(result.timelineCalendarEvents.map((e) => e.id)).toEqual(['a']);
    expect(result.totalNumberOfCalendarEvents).toBe(11);
  });

  it('reuses the cached list for a short time, and a change here or a read that raced with it never leaves a stale list', async () => {
    vi.useFakeTimers();
    try {
      fake.results.calendar_blocklist = { data: [{ id: 'b1', handle: '@evil.com' }], error: null };
      fake.results.calendar_events = { data: [ev('a')], error: null };
      fake.results.calendar_event_participants = { data: [{ calendar_event_id: 'a', handle: 'bob@evil.com', display_name: '', contact_id: null }], error: null };
      invalidateBlocklistCache();
      expect(await range()).toEqual([]); // blocked
      const reads = () => fake.calls.filter((c) => c.table === 'calendar_blocklist' && c.method === 'select').length;
      expect(reads()).toBe(1);
      await range();
      expect(reads()).toBe(1); // cached

      // someone else unblocks the domain: after the cache lifetime the next load sees it
      fake.results.calendar_blocklist = { data: [], error: null };
      vi.advanceTimersByTime(BLOCKLIST_CACHE_MS + 1);
      expect((await range()).map((e) => e.id)).toEqual(['a']);
      expect(reads()).toBe(2);

      // a Realtime change (or add/remove here) drops the cache straight away
      fake.results.calendar_blocklist = { data: [{ id: 'b1', handle: '@evil.com' }], error: null };
      invalidateBlocklistCache();
      expect(await range()).toEqual([]);

      // a read that started before a change and finished after it is used once but not kept
      let release!: () => void;
      fake.hold = new Promise<void>((r) => (release = r));
      invalidateBlocklistCache();
      const readsBefore = reads();
      const slow = range();
      await vi.waitFor(() => expect(reads()).toBe(readsBefore + 1)); // the blocklist read is now in flight (held)
      invalidateBlocklistCache(); // a change lands while the read is in flight
      release();
      await slow;
      fake.hold = undefined;
      const before = reads();
      await range();
      expect(reads()).toBe(before + 1); // the raced read was not cached, so this one read again
      await range();
      expect(reads()).toBe(before + 1); // and an ordinary read is cached again
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('event text and time zone', () => {
  it('removes every NUL and DEL character, not just the first', async () => {
    fake.rpc = { data: 'e1', error: null };
    await calendarEventApi.create({
      title: 'A\u0000B\u0000C\u007fD\u007f',
      description: 'x\u0000\u0000y',
      location: '',
      startsAt: '2031-01-05T10:00:00Z',
      endsAt: '2031-01-05T11:00:00Z',
      isFullDay: false,
      timeZone: 'UTC',
      visibility: 'SHARE_EVERYTHING',
      attendees: [],
      targets: []
    } as any);
    expect(fake.rpcCalls[0].name).toBe('create_calendar_event_with_guests');
    expect(fake.rpcCalls[0].args.p_event).toMatchObject({ title: 'ABCD', description: 'xy' });
  });

  it('strips control characters and falls back to UTC when the time zone is empty', async () => {
    fake.rpc = { data: 'e1', error: null };
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
    expect(fake.rpcCalls[0].args.p_event).toMatchObject({ title: 'Badtitle', time_zone: 'UTC' });
  });
});
