import { describe, it, expect, vi, beforeEach } from 'vitest';

const fake = vi.hoisted(() => ({
  calls: [] as { table: string; method: string; args: unknown[] }[],
  results: {} as Record<string, { data: unknown; error: unknown }>
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
  return { supabase: { from: builder } };
});

import { calendarEventApi } from './api';

const callsOf = (table: string, method: string) => fake.calls.filter((c) => c.table === table && c.method === method);

beforeEach(() => {
  fake.calls = [];
  fake.results = {};
});

describe('linking events to records', () => {
  it('links an existing event with an upsert that ignores duplicates', async () => {
    await calendarEventApi.linkToRecord('e1', { type: 'contact', id: 'c1' });
    const [upsert] = callsOf('calendar_event_targets', 'upsert');
    expect(upsert.args[0]).toEqual({ calendar_event_id: 'e1', target_type: 'contact', target_id: 'c1' });
    expect(upsert.args[1]).toMatchObject({ ignoreDuplicates: true });
  });

  it('unlinks by event and record', async () => {
    await calendarEventApi.unlinkFromRecord('e1', { type: 'deal', id: 'd1' });
    expect(callsOf('calendar_event_targets', 'delete')).toHaveLength(1);
    expect(callsOf('calendar_event_targets', 'eq').map((c) => c.args)).toEqual([['calendar_event_id', 'e1'], ['target_type', 'deal'], ['target_id', 'd1']]);
  });

  it('lists recent events that are not yet linked to the record', async () => {
    const row = (id: string) => ({ id, title: id, start_date: '2031-01-05T10:00:00Z', end_date: '2031-01-05T11:00:00Z', is_all_day: false });
    fake.results.calendar_events = { data: [row('a'), row('b'), row('c')], error: null };
    fake.results.calendar_event_targets = { data: [{ calendar_event_id: 'b' }], error: null };
    const events = await calendarEventApi.searchLinkable({ type: 'contact', id: 'c1' }, 'kick_off');
    expect(events.map((e) => e.id)).toEqual(['a', 'c']);
    expect(callsOf('calendar_events', 'ilike')[0].args).toEqual(['title', '%kick\\_off%']); // wildcard escaped
  });
});

describe('matching guests to contacts', () => {
  it('links an event\'s guests and the event to a contact when the contact appears', async () => {
    fake.results.calendar_event_participants = { data: [{ calendar_event_id: 'e1' }, { calendar_event_id: 'e1' }, { calendar_event_id: 'e2' }], error: null };
    const linked = await calendarEventApi.linkGuestsToContact({ id: 'c1', email: ' Ada@Example.com ' });
    expect(linked).toBe(2);
    expect(callsOf('calendar_event_participants', 'update')[0].args[0]).toEqual({ contact_id: 'c1' });
    expect(callsOf('calendar_event_participants', 'ilike')[0].args).toEqual(['handle', 'ada@example.com']);
    expect(callsOf('calendar_event_participants', 'is')[0].args).toEqual(['contact_id', null]); // only guests not linked yet
    expect(callsOf('calendar_event_targets', 'upsert')[0].args[0]).toEqual([
      { calendar_event_id: 'e1', target_type: 'contact', target_id: 'c1' },
      { calendar_event_id: 'e2', target_type: 'contact', target_id: 'c1' }
    ]);
  });

  it('does nothing for a contact without an email', async () => {
    expect(await calendarEventApi.linkGuestsToContact({ id: 'c1', email: '' })).toBe(0);
    expect(fake.calls).toHaveLength(0);
  });

  it('a new event links guests whose email is a contact\'s email, and links the contact too', async () => {
    fake.results.calendar_events = { data: { id: 'e9' }, error: null };
    fake.results.contacts = { data: [{ id: 'c1', email: 'ada@example.com' }], error: null };
    await calendarEventApi.create({
      title: 'Kickoff',
      description: '',
      location: '',
      startsAt: '2031-01-05T10:00:00Z',
      endsAt: '2031-01-05T11:00:00Z',
      isFullDay: false,
      timeZone: 'UTC',
      visibility: 'SHARE_EVERYTHING' as any,
      conferenceLink: '',
      attendees: [{ handle: 'Ada@Example.com' }, { handle: 'stranger@x.io' }],
      targets: [{ type: 'deal', id: 'd1' }]
    } as any);
    expect(callsOf('calendar_event_participants', 'insert')[0].args[0]).toEqual([
      { calendar_event_id: 'e9', handle: 'Ada@Example.com', display_name: '', contact_id: 'c1' },
      { calendar_event_id: 'e9', handle: 'stranger@x.io', display_name: '', contact_id: null }
    ]);
    expect(callsOf('calendar_event_targets', 'insert')[0].args[0]).toEqual([
      { calendar_event_id: 'e9', target_type: 'deal', target_id: 'd1' },
      { calendar_event_id: 'e9', target_type: 'contact', target_id: 'c1' }
    ]);
  });

  it('still saves the event when the contact lookup fails', async () => {
    fake.results.calendar_events = { data: { id: 'e9' }, error: null };
    fake.results.contacts = { data: null, error: new Error('down') };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      calendarEventApi.create({ title: 't', startsAt: '2031-01-05T10:00:00Z', endsAt: '2031-01-05T11:00:00Z', isFullDay: false, timeZone: 'UTC', visibility: 'SHARE_EVERYTHING', attendees: [{ handle: 'a@b.io' }], targets: [] } as any)
    ).resolves.toBe('e9');
  });
});
