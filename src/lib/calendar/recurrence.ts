/**
 * Ours (glue): repeat rules for calendar events. Twenty's calendar has no recurring events, so this is a small RFC 5545
 * RRULE subset: FREQ=DAILY|WEEKLY|MONTHLY|YEARLY with INTERVAL, COUNT, UNTIL and (weekly) BYDAY. Dates are worked out in
 * the browser's local time, so an event keeps its wall-clock time across daylight-saving changes.
 */

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurrenceRule {
  freq: RecurrenceFrequency;
  interval: number;
  /** total number of occurrences, counted from the first one */
  count?: number;
  until?: Date;
  /** weekly only: 0 = Sunday ... 6 = Saturday */
  byDay?: number[];
}

export interface Occurrence {
  start: Date;
  end: Date;
  /** 0 for the first occurrence of the series */
  index: number;
}

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const FREQUENCIES: RecurrenceFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

/** Most occurrences one expansion returns, and most candidate dates it examines (guards against runaway rules). */
export const MAX_OCCURRENCES = 1000;
const MAX_CANDIDATES = 20000;
export const MAX_INTERVAL = 99;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export const formatUtc = (d: Date): string =>
  `${pad(d.getUTCFullYear(), 4)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const parseUntil = (value: string): Date | null => {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  const date = h === undefined
    ? new Date(Number(y), Number(mo) - 1, Number(d), 23, 59, 59) // a date-only UNTIL includes that whole day
    : z
      ? new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
      : new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Parse an RRULE value ("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=6"). Returns null when the text is empty, malformed or
 * uses a part this module does not support (BYMONTHDAY, BYSETPOS, ...), so the caller can treat the event as a single one.
 */
export const parseRule = (text: string | null | undefined): RecurrenceRule | null => {
  if (!text) return null;
  const parts = text.trim().replace(/^RRULE:/i, '').split(';').filter(Boolean);
  const map = new Map<string, string>();
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq < 1) return null;
    map.set(part.slice(0, eq).toUpperCase(), part.slice(eq + 1));
  }
  const supported = new Set(['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'WKST']);
  for (const key of map.keys()) if (!supported.has(key)) return null;
  // weeks start on Monday (the RFC default); another week start changes which days a weekly rule picks, so it is not
  // supported and the event falls back to a single one
  if (map.has('WKST') && map.get('WKST')?.toUpperCase() !== 'MO') return null;

  const freq = map.get('FREQ')?.toUpperCase() as RecurrenceFrequency | undefined;
  if (!freq || !FREQUENCIES.includes(freq)) return null;

  const rule: RecurrenceRule = { freq, interval: 1 };
  if (map.has('INTERVAL')) {
    const interval = Number(map.get('INTERVAL'));
    if (!Number.isInteger(interval) || interval < 1 || interval > MAX_INTERVAL) return null;
    rule.interval = interval;
  }
  if (map.has('COUNT')) {
    const count = Number(map.get('COUNT'));
    if (!Number.isInteger(count) || count < 1 || count > MAX_OCCURRENCES) return null;
    rule.count = count;
  }
  if (map.has('UNTIL')) {
    const until = parseUntil(map.get('UNTIL') as string);
    if (!until) return null;
    rule.until = until;
  }
  if (map.has('COUNT') && map.has('UNTIL')) return null; // RFC 5545: not both
  if (map.has('BYDAY')) {
    if (freq !== 'WEEKLY') return null;
    const days: number[] = [];
    for (const code of (map.get('BYDAY') as string).split(',')) {
      const index = DAY_CODES.indexOf(code.trim().toUpperCase());
      if (index < 0) return null; // "1MO", "-1FR" (n-th weekday) are not supported
      if (!days.includes(index)) days.push(index);
    }
    if (days.length === 0) return null;
    rule.byDay = days.sort((a, b) => a - b);
  }
  return rule;
};

/** The RRULE text for a rule (no "RRULE:" prefix), in a stable order. */
export const formatRule = (rule: RecurrenceRule): string => {
  const parts = [`FREQ=${rule.freq}`];
  if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.byDay && rule.byDay.length > 0) parts.push(`BYDAY=${rule.byDay.map((d) => DAY_CODES[d]).join(',')}`);
  if (rule.count !== undefined) parts.push(`COUNT=${rule.count}`);
  if (rule.until) parts.push(`UNTIL=${formatUtc(rule.until)}`);
  return parts.join(';');
};

/** A short human description for the editor and the details dialog, e.g. "Every 2 weeks on Mon, Wed". */
export const describeRule = (rule: RecurrenceRule): string => {
  const unit = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' }[rule.freq];
  const every = rule.interval === 1 ? `Every ${unit}` : `Every ${rule.interval} ${unit}s`;
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const on = rule.byDay && rule.byDay.length > 0 ? ` on ${rule.byDay.map((d) => names[d]).join(', ')}` : '';
  const ends = rule.count !== undefined ? `, ${rule.count} times` : rule.until ? `, until ${rule.until.toLocaleDateString()}` : '';
  return `${every}${on}${ends}`;
};

const withTimeOf = (day: Date, time: Date): Date =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());

/** The candidate start dates of a rule in order, until the generator stops being asked (never ends by itself). */
function* candidates(start: Date, rule: RecurrenceRule): Generator<Date> {
  const y = start.getFullYear();
  const m = start.getMonth();
  const d = start.getDate();
  for (let k = 0; ; k += 1) {
    if (rule.freq === 'DAILY') {
      yield withTimeOf(new Date(y, m, d + k * rule.interval), start);
    } else if (rule.freq === 'WEEKLY') {
      const days = rule.byDay && rule.byDay.length > 0 ? rule.byDay : [start.getDay()];
      // weeks start on Monday (RFC 5545 default); the first week is the one containing the series start
      const mondayOffset = (start.getDay() + 6) % 7;
      const ordered = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
      for (const weekday of ordered) {
        const candidate = withTimeOf(new Date(y, m, d - mondayOffset + k * rule.interval * 7 + ((weekday + 6) % 7)), start);
        if (candidate.getTime() >= start.getTime()) yield candidate;
      }
    } else if (rule.freq === 'MONTHLY') {
      const candidate = new Date(y, m + k * rule.interval, d, start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
      if (candidate.getDate() === d) yield candidate; // a month without that day (31st) is skipped
    } else {
      const candidate = new Date(y + k * rule.interval, m, d, start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
      if (candidate.getMonth() === m) yield candidate; // 29 Feb in a non-leap year is skipped
    }
  }
}

/**
 * The occurrences of a repeating event that overlap [from, to]. `start`/`end` are the first occurrence; every occurrence
 * lasts as long as the first one. Bounded by MAX_OCCURRENCES results and MAX_CANDIDATES examined dates.
 */
export function expandOccurrences(
  start: Date,
  end: Date,
  rule: RecurrenceRule,
  from: Date,
  to: Date,
  options: { allDay?: boolean } = {}
): Occurrence[] {
  const duration = Math.max(0, end.getTime() - start.getTime());
  // an all-day event spans whole calendar days, and a local day can have 23 or 25 hours: keep the span in days
  const spanDays = Math.round(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86_400_000
  );
  const result: Occurrence[] = [];
  let index = 0;
  let examined = 0;
  for (const candidate of candidates(start, rule)) {
    examined += 1;
    if (examined > MAX_CANDIDATES || result.length >= MAX_OCCURRENCES) break;
    if (rule.count !== undefined && index >= rule.count) break;
    if (rule.until && candidate.getTime() > rule.until.getTime()) break;
    if (candidate.getTime() > to.getTime()) break;
    const occurrenceEnd = options.allDay
      ? new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + Math.max(0, spanDays), end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds())
      : new Date(candidate.getTime() + duration);
    if (occurrenceEnd.getTime() >= from.getTime()) result.push({ start: candidate, end: occurrenceEnd, index });
    index += 1;
  }
  return result;
}
