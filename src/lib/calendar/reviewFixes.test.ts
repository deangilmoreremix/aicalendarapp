import { describe, it, expect } from 'vitest';
import { parseRule, expandOccurrences, formatUtc } from './recurrence';
import { buildIcs } from './ics';
import { timelineEventsToIcs } from './icsEvents';

const at = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h);

describe('review fixes: recurrence and .ics', () => {
  it('rejects a rule whose week starts on a day other than Monday (it would expand differently)', () => {
    expect(parseRule('FREQ=WEEKLY;WKST=SU;BYDAY=SU,MO')).toBeNull();
    expect(parseRule('FREQ=WEEKLY;WKST=MO;BYDAY=MO')).not.toBeNull();
  });

  it('an all-day series keeps its length in calendar days', () => {
    const rule = parseRule('FREQ=DAILY;COUNT=3')!;
    const list = expandOccurrences(at(2031, 3, 8, 0), at(2031, 3, 10, 0), rule, at(2031, 1, 1), at(2031, 12, 31), { allDay: true });
    expect(list).toHaveLength(3);
    for (const o of list) {
      expect(o.end.getHours()).toBe(0);
      expect(o.end.getDate() - o.start.getDate()).toBe(2);
    }
  });

  it('writes a repeating timed event with its time zone, and an all-day UNTIL as a date', () => {
    const timed = buildIcs([{ uid: 'a@x', title: 'T', start: new Date('2031-01-06T14:00:00Z'), end: new Date('2031-01-06T15:00:00Z'), isAllDay: false, rrule: 'FREQ=WEEKLY', timeZone: 'America/New_York', attendees: [] }]);
    expect(timed).toContain('DTSTART;TZID=America/New_York:20310106T090000');
    expect(timed).toContain('DURATION:PT1H0M0S');
    expect(timed).not.toContain('DTEND');
    const allDay = buildIcs([{ uid: 'b@x', title: 'D', start: at(2031, 1, 6, 0), end: at(2031, 1, 7, 0), isAllDay: true, rrule: `FREQ=DAILY;UNTIL=${formatUtc(at(2031, 1, 10, 0))}`, attendees: [] }]);
    expect(allDay).toMatch(/RRULE:FREQ=DAILY;UNTIL=20310110(\r\n|$)/);
  });

  it('a record-card export carries the repeat rule and the imported UID', () => {
    const events = [{ id: 's1', title: 'Standup', isFullDay: false, startsAt: '2031-01-06T09:00:00.000Z', endsAt: '2031-01-06T09:30:00.000Z', visibility: 'SHARE_EVERYTHING', participants: [] }] as any;
    const [plain] = timelineEventsToIcs(events);
    expect(plain.uid).toBe('s1@aicalendar');
    expect(plain.rrule).toBeUndefined();
    const [rich] = timelineEventsToIcs(events, new Map([['s1', { recurrenceRule: 'FREQ=WEEKLY', icalUid: 'orig@cal' }]]));
    expect(rich).toMatchObject({ uid: 'orig@cal', rrule: 'FREQ=WEEKLY' });
    expect(rich.timeZone).toBeTruthy();
  });
});

import { expandRepeatingEvent } from '../../services/api';

describe('review fixes, round two', () => {
  it('a series with an unsupported rule is only shown when it overlaps the range', () => {
    const event = { id: 'u1', title: 'Monthly', startDate: new Date(2031, 0, 14, 9), endDate: new Date(2031, 0, 14, 10), isAllDay: false, recurrenceRule: 'FREQ=MONTHLY;BYDAY=2TU' } as any;
    expect(expandRepeatingEvent(event, new Date(2031, 2, 1), new Date(2031, 2, 31))).toEqual([]);
    expect(expandRepeatingEvent(event, new Date(2031, 0, 1), new Date(2031, 0, 31))).toHaveLength(1);
  });
});
