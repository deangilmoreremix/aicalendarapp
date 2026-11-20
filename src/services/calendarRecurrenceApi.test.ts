import { describe, it, expect, vi, beforeEach } from 'vitest';

const fake = vi.hoisted(() => ({
  events: [] as any[],
  calls: [] as { table: string; method: string; args: unknown[] }[],
  results: {} as Record<string, { data: unknown; error: unknown }>,
  rpcCalls: [] as { name: string; args: any }[],
  rpcResult: { data: null as unknown, error: null as unknown }
}));

vi.mock('../lib/supabase', () => {
  const chain = (table: string) => {
    const q: any = new Proxy({}, {
      get: (_t, method: string) => {
        if (method === 'then') {
          return (res: (v: unknown) => unknown) =>
            Promise.resolve(fake.results[table] ?? { data: table === 'calendar_events' ? fake.events : [], error: null }).then(res);
        }
        return (...args: unknown[]) => {
          fake.calls.push({ table, method, args });
          return q;
        };
      }
    });
    return q;
  };
  return { supabase: { from: chain, rpc: async (name: string, args: unknown) => { fake.rpcCalls.push({ name, args }); return fake.rpcResult; } } };
});

import { calendarEventApi, expandRepeatingEvent, storedEventId, mapCalendarEventFromDB } from './api';
import { canRescheduleRecord } from '../components/calendar/unifiedCalendarRecords';

const row = (over: Record<string, unknown> = {}) => ({ id: 's1', title: 'Standup', start_date: new Date(2031, 0, 6, 9).toISOString(), end_date: new Date(2031, 0, 6, 9, 30).toISOString(), is_all_day: false, ...over });

beforeEach(() => {
  fake.events = [];
  fake.calls = [];
  fake.results = {};
  fake.rpcCalls = [];
  fake.rpcResult = { data: null, error: null };
});

describe('repeating events in the calendar API', () => {
  it('maps the stored rule and uid', () => {
    const event = mapCalendarEventFromDB(row({ recurrence_rule: 'FREQ=DAILY;COUNT=3', ical_uid: 'u@x' }) as any);
    expect(event).toMatchObject({ recurrenceRule: 'FREQ=DAILY;COUNT=3', icalUid: 'u@x' });
    expect(mapCalendarEventFromDB(row() as any).recurrenceRule).toBeUndefined();
  });

  it('expands a series into occurrences with their own ids and dates, remembering the series', () => {
    const series = mapCalendarEventFromDB(row({ recurrence_rule: 'FREQ=DAILY;COUNT=3' }) as any);
    const list = expandRepeatingEvent(series, new Date(2031, 0, 1), new Date(2031, 1, 1));
    expect(list.map((e) => e.id)).toEqual(['s1#0', 's1#1', 's1#2']);
    expect(list.map((e) => e.startDate.getDate())).toEqual([6, 7, 8]);
    expect(list[1]).toMatchObject({ seriesId: 's1', occurrenceIndex: 1 });
    expect(list[1].seriesStartDate).toEqual(series.startDate);
    expect(list[1].endDate.getTime() - list[1].startDate.getTime()).toBe(30 * 60_000);
  });

  it('a plain event stays as it is, and an unsupported rule is dropped so it shows once', () => {
    const plain = mapCalendarEventFromDB(row() as any);
    expect(expandRepeatingEvent(plain, new Date(2031, 0, 1), new Date(2031, 1, 1))).toEqual([plain]);
    const odd = mapCalendarEventFromDB(row({ recurrence_rule: 'FREQ=MONTHLY;BYDAY=2TU' }) as any);
    const [only] = expandRepeatingEvent(odd, new Date(2031, 0, 1), new Date(2031, 1, 1));
    expect(only.id).toBe('s1');
    expect(only.recurrenceRule).toBeUndefined();
  });

  it('storedEventId strips the occurrence suffix', () => {
    expect(storedEventId('s1#4')).toBe('s1');
    expect(storedEventId('s1')).toBe('s1');
  });

  it('getRange reads series whatever their end date, and returns only the occurrences in the range', async () => {
    fake.events = [row({ recurrence_rule: 'FREQ=WEEKLY;COUNT=10' })];
    const events = await calendarEventApi.getRange(new Date(2031, 0, 20), new Date(2031, 0, 31));
    const or = fake.calls.find((c) => c.table === 'calendar_events' && c.method === 'or');
    expect(String(or?.args[0])).toContain('recurrence_rule.not.is.null');
    expect(events.map((e) => e.startDate.getDate())).toEqual([20, 27]); // Mondays 6, 13, 20, 27 ... only 20 and 27 are in range
    expect(events.every((e) => e.seriesId === 's1')).toBe(true);
  });

  it('an occurrence cannot be dragged on its own, a plain event can', () => {
    const [occurrence] = expandRepeatingEvent(mapCalendarEventFromDB(row({ recurrence_rule: 'FREQ=DAILY;COUNT=2' }) as any), new Date(2031, 0, 1), new Date(2031, 1, 1));
    expect(canRescheduleRecord({ type: 'event', raw: occurrence })).toBe(false);
    expect(canRescheduleRecord({ type: 'event', raw: mapCalendarEventFromDB(row() as any) })).toBe(true);
  });

  it('create sends the rule and uid; update can set or clear the rule', async () => {
    fake.rpcResult = { data: 'new-id', error: null };
    await calendarEventApi.create({ title: 'T', startsAt: '2031-01-06T09:00:00Z', endsAt: '2031-01-06T10:00:00Z', isFullDay: false, timeZone: 'UTC', visibility: 'SHARE_EVERYTHING' as any, recurrenceRule: 'FREQ=DAILY;COUNT=2', icalUid: 'u@x', attendees: [], targets: [] });
    expect(fake.rpcCalls[0].args.p_event).toMatchObject({ recurrence_rule: 'FREQ=DAILY;COUNT=2', ical_uid: 'u@x' });
    fake.results.calendar_events = { data: row(), error: null };
    await calendarEventApi.update('s1', { recurrenceRule: null });
    const patch = fake.calls.find((c) => c.table === 'calendar_events' && c.method === 'update')?.args[0] as Record<string, unknown>;
    expect(patch.recurrence_rule).toBeNull();
  });

  it('existingIcalUids asks in batches and returns the stored ones', async () => {
    fake.results.calendar_events = { data: [{ ical_uid: 'a@x' }], error: null };
    const found = await calendarEventApi.existingIcalUids(['a@x', 'b@x', 'a@x', '']);
    expect([...found]).toEqual(['a@x']);
    expect(fake.calls.filter((c) => c.method === 'in')).toHaveLength(1);
    expect(fake.calls.find((c) => c.method === 'in')?.args[1]).toEqual(['a@x', 'b@x']);
  });

  it('cleanOrphans calls the database function and returns the count', async () => {
    fake.rpcResult = { data: 3, error: null };
    expect(await calendarEventApi.cleanOrphans()).toBe(3);
    expect(fake.rpcCalls[0]).toEqual({ name: 'clean_orphan_calendar_events', args: { p_older_than: '1 hours' } });
    fake.rpcResult = { data: null, error: new Error('down') };
    await expect(calendarEventApi.cleanOrphans()).rejects.toThrow('down');
  });
});
