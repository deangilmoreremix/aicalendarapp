import { describe, it, expect } from 'vitest';
import { parseRule, formatRule, describeRule, expandOccurrences, MAX_OCCURRENCES } from './recurrence';

const at = (y: number, m: number, d: number, h = 9, mi = 0) => new Date(y, m - 1, d, h, mi);
const wide = (): [Date, Date] => [at(2000, 1, 1), at(2100, 1, 1)];
const days = (list: { start: Date }[]) => list.map((o) => `${o.start.getMonth() + 1}/${o.start.getDate()}`);

describe('parseRule / formatRule', () => {
  it('parses and formats the supported parts', () => {
    const rule = parseRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=WE,MO;COUNT=6');
    expect(rule).toEqual({ freq: 'WEEKLY', interval: 2, count: 6, byDay: [1, 3] });
    expect(formatRule(rule!)).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=6');
  });

  it('accepts an RRULE: prefix, lower case, and a UTC or date-only UNTIL', () => {
    expect(parseRule('RRULE:freq=daily;until=20300105T100000Z')).toMatchObject({ freq: 'DAILY', interval: 1 });
    expect(parseRule('FREQ=DAILY;UNTIL=20300105')?.until?.getDate()).toBe(5);
  });

  it.each([
    [''], ['nonsense'], ['FREQ=HOURLY'], ['FREQ=DAILY;INTERVAL=0'], ['FREQ=DAILY;INTERVAL=1000'], ['FREQ=DAILY;COUNT=0'],
    ['FREQ=DAILY;COUNT=5;UNTIL=20300101'], ['FREQ=MONTHLY;BYMONTHDAY=15'], ['FREQ=MONTHLY;BYDAY=MO'], ['FREQ=WEEKLY;BYDAY=1MO'],
    ['FREQ=WEEKLY;BYDAY=XX'], ['FREQ=DAILY;UNTIL=soon'], ['INTERVAL=2']
  ])('rejects %s (the event is then treated as a single one)', (text) => {
    expect(parseRule(text)).toBeNull();
  });

  it('round trips UNTIL through UTC', () => {
    const rule = parseRule('FREQ=DAILY;UNTIL=20300105T100000Z')!;
    expect(parseRule(formatRule(rule))!.until!.getTime()).toBe(rule.until!.getTime());
  });

  it('describes rules for people', () => {
    expect(describeRule(parseRule('FREQ=DAILY')!)).toBe('Every day');
    expect(describeRule(parseRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=4')!)).toBe('Every 2 weeks on Mon, Wed, 4 times');
  });
});

describe('expandOccurrences', () => {
  const start = at(2030, 1, 7); // a Monday
  const end = at(2030, 1, 7, 10);

  it('daily with an interval and COUNT counts from the first occurrence', () => {
    const list = expandOccurrences(start, end, parseRule('FREQ=DAILY;INTERVAL=2;COUNT=4')!, ...wide());
    expect(days(list)).toEqual(['1/7', '1/9', '1/11', '1/13']);
    expect(list.map((o) => o.index)).toEqual([0, 1, 2, 3]);
  });

  it('only returns the occurrences inside the range, but COUNT still counts the earlier ones', () => {
    const list = expandOccurrences(start, end, parseRule('FREQ=DAILY;COUNT=5')!, at(2030, 1, 10), at(2030, 1, 20));
    expect(days(list)).toEqual(['1/10', '1/11']); // occurrences 0..4 are 1/7..1/11
    expect(list[0].index).toBe(3);
  });

  it('an occurrence that started before the range but still overlaps it is included', () => {
    const longEnd = at(2030, 1, 8, 12); // lasts 27 hours
    const list = expandOccurrences(start, longEnd, parseRule('FREQ=DAILY;COUNT=3')!, at(2030, 1, 8, 11), at(2030, 1, 8, 13));
    expect(days(list)).toEqual(['1/7', '1/8']);
  });

  it('weekly on several days, weeks start on Monday, nothing before the first occurrence', () => {
    // series starts on Wednesday 9 Jan; BYDAY=MO,WE,FR: Mon 7 Jan is before the start and is not an occurrence
    const wed = at(2030, 1, 9);
    const list = expandOccurrences(wed, at(2030, 1, 9, 10), parseRule('FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=5')!, ...wide());
    expect(days(list)).toEqual(['1/9', '1/11', '1/14', '1/16', '1/18']);
  });

  it('weekly without BYDAY repeats on the weekday of the start, every 2 weeks', () => {
    const list = expandOccurrences(start, end, parseRule('FREQ=WEEKLY;INTERVAL=2;COUNT=3')!, ...wide());
    expect(days(list)).toEqual(['1/7', '1/21', '2/4']);
  });

  it('monthly skips months without that day; yearly skips 29 Feb in non-leap years', () => {
    const jan31 = at(2030, 1, 31);
    const monthly = expandOccurrences(jan31, at(2030, 1, 31, 10), parseRule('FREQ=MONTHLY;COUNT=3')!, ...wide());
    expect(days(monthly)).toEqual(['1/31', '3/31', '5/31']);
    const leap = at(2032, 2, 29);
    const yearly = expandOccurrences(leap, at(2032, 2, 29, 10), parseRule('FREQ=YEARLY;COUNT=2')!, ...wide());
    expect(yearly.map((o) => o.start.getFullYear())).toEqual([2032, 2036]);
  });

  it('UNTIL ends the series (inclusive)', () => {
    const list = expandOccurrences(start, end, parseRule('FREQ=DAILY;UNTIL=20300110')!, ...wide());
    expect(days(list)).toEqual(['1/7', '1/8', '1/9', '1/10']);
  });

  it('keeps the wall-clock time across a daylight-saving change', () => {
    const list = expandOccurrences(at(2030, 3, 1, 9), at(2030, 3, 1, 10), parseRule('FREQ=DAILY;COUNT=60')!, ...wide());
    expect(new Set(list.map((o) => o.start.getHours()))).toEqual(new Set([9]));
    expect(new Set(list.map((o) => o.end.getHours() - o.start.getHours()))).toEqual(new Set([1]));
  });

  it('is bounded: a rule that never ends returns at most MAX_OCCURRENCES', () => {
    const list = expandOccurrences(start, end, parseRule('FREQ=DAILY')!, ...wide());
    expect(list).toHaveLength(MAX_OCCURRENCES);
  });

  it('a zero-length event stays zero-length', () => {
    const list = expandOccurrences(start, start, parseRule('FREQ=DAILY;COUNT=2')!, ...wide());
    expect(list.every((o) => o.start.getTime() === o.end.getTime())).toBe(true);
  });
});
