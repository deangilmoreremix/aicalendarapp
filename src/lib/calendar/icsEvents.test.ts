import { describe, it, expect } from 'vitest';
import { calendarEventsToIcs, parsedIcsToCreateInput, timelineEventsToIcs } from './icsEvents';
import type { CalendarEvent } from '../../types';
import type { ParsedIcsEvent } from './ics';

const event = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'e1', title: 'Kickoff', startDate: new Date(2030, 0, 5, 10), endDate: new Date(2030, 0, 5, 11), isAllDay: false, calendarId: 'default', type: 'event', status: 'scheduled', ...over
});

describe('calendarEventsToIcs', () => {
  it('uses the stored uid when there is one and a stable generated one otherwise', () => {
    const [a, b] = calendarEventsToIcs([event({ icalUid: 'orig@x' }), event({ id: 'e2' })]);
    expect(a.uid).toBe('orig@x');
    expect(b.uid).toBe('e2@aicalendar');
  });

  it('writes a repeating event once, with its rule and the first occurrence dates', () => {
    const first = new Date(2030, 0, 5, 10);
    const occurrences = [0, 1, 2].map((i) => event({ id: `s#${i}`, seriesId: 's', occurrenceIndex: i, recurrenceRule: 'FREQ=DAILY;COUNT=3', seriesStartDate: first, seriesEndDate: new Date(2030, 0, 5, 11), startDate: new Date(2030, 0, 5 + i, 10), endDate: new Date(2030, 0, 5 + i, 11) }));
    const out = calendarEventsToIcs(occurrences);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ uid: 's@aicalendar', rrule: 'FREQ=DAILY;COUNT=3', start: first });
  });

  it('writes guests that have an address', () => {
    const [e] = calendarEventsToIcs([event({ participants: [{ firstName: '', lastName: '', displayName: 'Ada', handle: 'ada@x.io' }, { firstName: '', lastName: '', displayName: 'No handle' }] })]);
    expect(e.attendees).toEqual([{ handle: 'ada@x.io', displayName: 'Ada' }]);
  });
});

describe('timelineEventsToIcs', () => {
  it('leaves out events whose details are not shared (no title)', () => {
    const base = { isFullDay: false, startsAt: '2030-01-05T10:00:00Z', endsAt: '2030-01-05T11:00:00Z', visibility: 'SHARE_EVERYTHING' as any };
    const out = timelineEventsToIcs([{ ...base, id: 'a', title: 'Shared' }, { ...base, id: 'b' }]);
    expect(out.map((e) => e.title)).toEqual(['Shared']);
    expect(out[0].uid).toBe('a@aicalendar');
  });
});

describe('parsedIcsToCreateInput', () => {
  const parsed = (over: Partial<ParsedIcsEvent> = {}): ParsedIcsEvent => ({
    uid: 'u@x', title: 'T', start: new Date(2030, 0, 5, 10), end: new Date(2030, 0, 5, 11), isAllDay: false, attendees: [{ handle: 'ada@x.io', displayName: 'Ada' }], ...over
  });

  it('keeps instants for timed events and plain dates for whole-day events', () => {
    const timed = parsedIcsToCreateInput(parsed(), 'Europe/Paris');
    expect(timed).toMatchObject({ startsAt: new Date(2030, 0, 5, 10).toISOString(), isFullDay: false, timeZone: 'Europe/Paris', icalUid: 'u@x', targets: [] });
    const day = parsedIcsToCreateInput(parsed({ isAllDay: true, start: new Date(2030, 0, 5), end: new Date(2030, 0, 6) }), 'UTC');
    expect(day).toMatchObject({ startsAt: '2030-01-05', endsAt: '2030-01-06', isFullDay: true });
  });

  it('passes the rule and guests, and leaves out an empty uid', () => {
    const input = parsedIcsToCreateInput(parsed({ uid: '', rrule: 'FREQ=DAILY;COUNT=2' }), 'UTC');
    expect(input.recurrenceRule).toBe('FREQ=DAILY;COUNT=2');
    expect(input.icalUid).toBeUndefined();
    expect(input.attendees).toEqual([{ handle: 'ada@x.io', displayName: 'Ada' }]);
  });
});
