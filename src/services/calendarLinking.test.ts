import { describe, it, expect, vi, beforeEach } from 'vitest';

const fake = vi.hoisted(() => ({
  calls: [] as { table: string; method: string; args: unknown[] }[],
  results: {} as Record<string, { data: unknown; error: unknown }>,
  rpcCalls: [] as { name: string; args: any }[],
  rpcResult: { data: null as unknown, error: null as unknown }
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
  return { supabase: { from: builder, rpc: async (name: string, args: unknown) => { fake.rpcCalls.push({ name, args }); return fake.rpcResult; } } };
});

import { calendarEventApi } from './api';

const callsOf = (table: string, method: string) => fake.calls.filter((c) => c.table === table && c.method === method);

beforeEach(() => {
  fake.calls = [];
  fake.results = {};
  fake.rpcCalls = [];
  fake.rpcResult = { data: null, error: null };
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

  it('lists recent events that are not yet linked to the record, excluding the linked ones in the query itself', async () => {
    const row = (id: string) => ({ id, title: id, start_date: '2031-01-05T10:00:00Z', end_date: '2031-01-05T11:00:00Z', is_all_day: false });
    const B = '3f2b8c1e-1111-4222-8333-444455556666';
    const X = '3f2b8c1e-1111-4222-8333-444455557777';
    fake.results.calendar_event_targets = { data: [{ calendar_event_id: B }, { calendar_event_id: X }], error: null };
    fake.results.calendar_events = { data: [row('a'), row('c')], error: null };
    const events = await calendarEventApi.searchLinkable({ type: 'contact', id: 'c1' }, 'kick_off', 20);
    expect(events.map((e) => e.id)).toEqual(['a', 'c']);
    expect(callsOf('calendar_events', 'not')[0].args).toEqual(['id', 'in', `(${B},${X})`]); // before the limit, not after
    expect(callsOf('calendar_events', 'limit')[0].args).toEqual([20]);
    expect(callsOf('calendar_events', 'ilike')[0].args).toEqual(['title', '%kick\\_off%']); // wildcard escaped
    // ids that are not UUIDs never reach the filter
    fake.calls = [];
    fake.results.calendar_event_targets = { data: [{ calendar_event_id: B }, { calendar_event_id: 'x),id.neq.(' }], error: null };
    await calendarEventApi.searchLinkable({ type: 'contact', id: 'c1' });
    expect(callsOf('calendar_events', 'not')[0].args).toEqual(['id', 'in', `(${B})`]);
    // nothing linked yet: no exclusion at all
    fake.calls = [];
    fake.results.calendar_event_targets = { data: [], error: null };
    await calendarEventApi.searchLinkable({ type: 'deal', id: 'd1' });
    expect(callsOf('calendar_events', 'not')).toHaveLength(0);
  });
});

describe('matching guests to contacts', () => {
  it("links a contact's guests and events in one database call (one transaction)", async () => {
    fake.rpcResult = { data: 2, error: null };
    const linked = await calendarEventApi.linkGuestsToContact({ id: 'c1', email: ' Ada@Example.com ' });
    expect(linked).toBe(2);
    expect(fake.rpcCalls).toEqual([{ name: 'link_guests_to_contact', args: { p_contact_id: 'c1', p_email: 'ada@example.com' } }]);
    expect(fake.calls).toHaveLength(0); // no separate table writes that could half succeed
  });

  it('reports a failure, and running it again simply tries again', async () => {
    fake.rpcResult = { data: null, error: new Error('down') };
    await expect(calendarEventApi.linkGuestsToContact({ id: 'c1', email: 'ada@example.com' })).rejects.toThrow('down');
    fake.rpcResult = { data: 1, error: null };
    await expect(calendarEventApi.linkGuestsToContact({ id: 'c1', email: 'ada@example.com' })).resolves.toBe(1);
    expect(fake.rpcCalls).toHaveLength(2);
  });

  it('does nothing for a contact without an email', async () => {
    expect(await calendarEventApi.linkGuestsToContact({ id: 'c1', email: '' })).toBe(0);
    expect(fake.rpcCalls).toHaveLength(0);
  });

  it("a new event links guests whose email is a contact's email, and links the contact too, in one call", async () => {
    fake.rpcResult = { data: 'e9', error: null };
    fake.results.contacts = { data: [{ id: 'c1', email: 'ada@example.com' }], error: null };
    const id = await calendarEventApi.create({
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
    expect(id).toBe('e9');
    expect(fake.rpcCalls).toHaveLength(1);
    expect(fake.rpcCalls[0].name).toBe('create_calendar_event_with_guests');
    expect(fake.rpcCalls[0].args.p_participants).toEqual([
      { handle: 'Ada@Example.com', display_name: '', contact_id: 'c1' },
      { handle: 'stranger@x.io', display_name: '', contact_id: null }
    ]);
    expect(fake.rpcCalls[0].args.p_targets).toEqual([
      { target_type: 'deal', target_id: 'd1' },
      { target_type: 'contact', target_id: 'c1' }
    ]);
    // the database function does all the writing: nothing is written (or cleaned up) from here
    expect(fake.calls.filter((c) => c.table.startsWith('calendar_') && c.method !== 'select' && c.method !== 'in' && c.method !== 'ilike')).toHaveLength(0);
  });

  it('reports the failure and leaves nothing to clean up when the database function fails', async () => {
    fake.rpcResult = { data: null, error: new Error('links down') };
    await expect(
      calendarEventApi.create({ title: 't', startsAt: '2031-01-05T10:00:00Z', endsAt: '2031-01-05T11:00:00Z', isFullDay: false, timeZone: 'UTC', visibility: 'SHARE_EVERYTHING', attendees: [], targets: [{ type: 'deal', id: 'd1' }] } as any)
    ).rejects.toThrow('links down');
    expect(fake.calls.filter((c) => c.method === 'delete')).toHaveLength(0);
  });

  it('still saves the event when the contact lookup fails', async () => {
    fake.rpcResult = { data: 'e9', error: null };
    fake.results.contacts = { data: null, error: new Error('down') };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      calendarEventApi.create({ title: 't', startsAt: '2031-01-05T10:00:00Z', endsAt: '2031-01-05T11:00:00Z', isFullDay: false, timeZone: 'UTC', visibility: 'SHARE_EVERYTHING', attendees: [{ handle: 'a@b.io' }], targets: [] } as any)
    ).resolves.toBe('e9');
  });
});
