import { describe, it, expect } from 'vitest';
import { buildIcs, parseIcs, foldLine, ICS_MAX_EVENTS, type IcsEvent } from './ics';

const base = (over: Partial<IcsEvent> = {}): IcsEvent => ({
  uid: 'e1@example', title: 'Kickoff', start: new Date(Date.UTC(2030, 0, 5, 10, 0, 0)), end: new Date(Date.UTC(2030, 0, 5, 11, 30, 0)),
  isAllDay: false, attendees: [], ...over
});
const wrap = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}END:VCALENDAR\r\n`;

describe('buildIcs', () => {
  it('writes a valid calendar with CRLF line ends and UTC times', () => {
    const text = buildIcs([base()], new Date(Date.UTC(2030, 0, 1)));
    expect(text.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(text).toContain('UID:e1@example\r\n');
    expect(text).toContain('DTSTAMP:20300101T000000Z\r\n');
    expect(text).toContain('DTSTART:20300105T100000Z\r\nDTEND:20300105T113000Z\r\n');
    expect(text.replace(/\r\n/g, '').includes('\n')).toBe(false);
  });

  it('escapes text, writes attendees and the repeat rule', () => {
    const text = buildIcs([base({ title: 'A, B; C\\D', description: 'line1\nline2', location: 'Room 1', rrule: 'FREQ=WEEKLY;COUNT=3', attendees: [{ handle: 'ada@example.com', displayName: 'Lovelace, Ada' }, { handle: 'x@y.io' }] })]);
    expect(text).toContain('SUMMARY:A\\, B\\; C\\\\D\r\n');
    expect(text).toContain('DESCRIPTION:line1\\nline2\r\n');
    expect(text).toContain('LOCATION:Room 1\r\n');
    expect(text).toContain('RRULE:FREQ=WEEKLY;COUNT=3\r\n');
    expect(text).toContain('ATTENDEE;CN="Lovelace, Ada":mailto:ada@example.com\r\n');
    expect(text).toContain('ATTENDEE:mailto:x@y.io\r\n');
  });

  it('writes whole-day events with the exclusive end date the app stores', () => {
    const text = buildIcs([base({ isAllDay: true, start: new Date(2030, 0, 5), end: new Date(2030, 0, 7) })]);
    expect(text).toContain('DTSTART;VALUE=DATE:20300105\r\nDTEND;VALUE=DATE:20300107\r\n');
    const oneDay = buildIcs([base({ isAllDay: true, start: new Date(2030, 0, 5), end: new Date(2030, 0, 5) })]);
    expect(oneDay).toContain('DTEND;VALUE=DATE:20300106\r\n'); // an end that is not after the start still lasts one day
  });

  it('folds long lines at 75 octets without splitting a multi-byte character', () => {
    const long = 'é'.repeat(100); // 200 bytes
    const folded = foldLine(`SUMMARY:${long}`);
    const encoder = new TextEncoder();
    for (const part of folded.split('\r\n')) expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe(`SUMMARY:${long}`);
  });
});

describe('parseIcs', () => {
  it('round trips what buildIcs writes', () => {
    const original = base({ title: 'A, B; C', description: 'x\ny', location: 'Room', rrule: 'FREQ=DAILY;COUNT=2', attendees: [{ handle: 'ada@example.com', displayName: 'Lovelace, Ada' }] });
    const { events, warnings } = parseIcs(buildIcs([original]));
    expect(warnings).toEqual([]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ uid: 'e1@example', title: 'A, B; C', description: 'x\ny', location: 'Room', rrule: 'FREQ=DAILY;COUNT=2', isAllDay: false, attendees: [{ handle: 'ada@example.com', displayName: 'Lovelace, Ada' }] });
    expect(events[0].start.getTime()).toBe(original.start.getTime());
    expect(events[0].end.getTime()).toBe(original.end.getTime());
  });

  it('round trips a whole-day event', () => {
    const { events } = parseIcs(buildIcs([base({ isAllDay: true, start: new Date(2030, 0, 5), end: new Date(2030, 0, 7) })]));
    expect(events[0].isAllDay).toBe(true);
    expect(events[0].start).toEqual(new Date(2030, 0, 5));
    expect(events[0].end).toEqual(new Date(2030, 0, 7));
  });

  it('a whole-day event without DTEND lasts one day; with DURATION:P2D two', () => {
    const one = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nDTSTART;VALUE=DATE:20300105\r\nSUMMARY:S\r\nEND:VEVENT\r\n')).events[0];
    expect(one.end).toEqual(new Date(2030, 0, 6));
    const two = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nDTSTART;VALUE=DATE:20300105\r\nDURATION:P2D\r\nSUMMARY:S\r\nEND:VEVENT\r\n')).events[0];
    expect(two.end).toEqual(new Date(2030, 0, 7));
  });

  it('reads UTC, TZID, floating times and unfolds long lines', () => {
    const text = wrap(
      'BEGIN:VEVENT\r\nUID:a\r\nDTSTART:20300105T100000Z\r\nDTEND:20300105T110000Z\r\nSUMMARY:Utc\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nUID:b\r\nDTSTART;TZID=America/New_York:20300105T090000\r\nDTEND;TZID=America/New_York:20300105T100000\r\nSUMMARY:Zoned\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nUID:c\r\nDTSTART:20300105T090000\r\nDURATION:PT45M\r\nSUMMARY:Float\r\n ing title\r\nEND:VEVENT\r\n'
    );
    const { events, warnings } = parseIcs(text);
    expect(warnings).toEqual([]);
    expect(events[0].start.toISOString()).toBe('2030-01-05T10:00:00.000Z');
    expect(events[1].start.toISOString()).toBe('2030-01-05T14:00:00.000Z'); // 09:00 in New York (UTC-5 in January)
    expect(events[2].title).toBe('Floating title');
    expect(events[2].end.getTime() - events[2].start.getTime()).toBe(45 * 60_000);
  });

  it('applies daylight saving for TZID times', () => {
    const { events } = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nDTSTART;TZID=America/New_York:20300705T090000\r\nDTEND;TZID=America/New_York:20300705T100000\r\nSUMMARY:Summer\r\nEND:VEVENT\r\n'));
    expect(events[0].start.toISOString()).toBe('2030-07-05T13:00:00.000Z');
  });

  it('warns about an unknown time zone and reads the time as local', () => {
    const { events, warnings } = parseIcs(wrap('BEGIN:VEVENT\r\nUID:a\r\nDTSTART;TZID=Not/AZone:20300105T090000\r\nSUMMARY:X\r\nEND:VEVENT\r\n'));
    expect(events[0].start).toEqual(new Date(2030, 0, 5, 9, 0, 0));
    expect(warnings.join(' ')).toMatch(/unknown time zone/);
  });

  it('skips cancelled events, edited occurrences and events without a start, and says so', () => {
    const text = wrap(
      'BEGIN:VEVENT\r\nUID:a\r\nDTSTART:20300105T100000Z\r\nSTATUS:CANCELLED\r\nSUMMARY:Gone\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nUID:b\r\nRECURRENCE-ID:20300105T100000Z\r\nDTSTART:20300105T120000Z\r\nSUMMARY:Moved\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nUID:c\r\nSUMMARY:No start\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nUID:d\r\nDTSTART:20300105T100000Z\r\nSUMMARY:Kept\r\nEND:VEVENT\r\n'
    );
    const { events, warnings } = parseIcs(text);
    expect(events.map((e) => e.title)).toEqual(['Kept']);
    expect(warnings).toHaveLength(3);
  });

  it('keeps a supported repeat rule, and imports an unsupported one as a single event with a warning', () => {
    const text = wrap(
      'BEGIN:VEVENT\r\nUID:a\r\nDTSTART:20300105T100000Z\r\nRRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=3\r\nSUMMARY:Ok\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nUID:b\r\nDTSTART:20300105T100000Z\r\nRRULE:FREQ=MONTHLY;BYDAY=2TU\r\nSUMMARY:Odd\r\nEND:VEVENT\r\n'
    );
    const { events, warnings } = parseIcs(text);
    expect(events[0].rrule).toBe('FREQ=WEEKLY;BYDAY=MO;COUNT=3');
    expect(events[1].rrule).toBeUndefined();
    expect(events[1].rruleUnsupported).toBe(true);
    expect(warnings.join(' ')).toMatch(/repeat rule this app does not support/);
  });

  it('ignores alarms inside an event, keeps only mailto attendees, and lowercases addresses', () => {
    const text = wrap('BEGIN:VEVENT\r\nUID:a\r\nDTSTART:20300105T100000Z\r\nSUMMARY:S\r\nATTENDEE;CN="Ada L":mailto:Ada@Example.com\r\nATTENDEE:tel:+123\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:ring\r\nEND:VALARM\r\nEND:VEVENT\r\n');
    const { events } = parseIcs(text);
    expect(events[0].attendees).toEqual([{ handle: 'ada@example.com', displayName: 'Ada L' }]);
    expect(events[0].description).toBeUndefined(); // the alarm's DESCRIPTION is not the event's
  });

  it('handles LF-only line ends and empty or garbage input', () => {
    expect(parseIcs('BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:a\nDTSTART:20300105T100000Z\nSUMMARY:S\nEND:VEVENT\nEND:VCALENDAR').events).toHaveLength(1);
    expect(parseIcs('').events).toEqual([]);
    expect(parseIcs('this is not a calendar').events).toEqual([]);
  });

  it('refuses a file over the size limit and caps the number of events', () => {
    expect(parseIcs('x'.repeat(1_000_001)).events).toEqual([]);
    const many = Array.from({ length: ICS_MAX_EVENTS + 5 }, (_v, i) => `BEGIN:VEVENT\r\nUID:${i}\r\nDTSTART:20300105T100000Z\r\nSUMMARY:E${i}\r\nEND:VEVENT\r\n`).join('');
    const { events, warnings } = parseIcs(wrap(many));
    expect(events).toHaveLength(ICS_MAX_EVENTS);
    expect(warnings.join(' ')).toMatch(/first 500/);
  });
});
