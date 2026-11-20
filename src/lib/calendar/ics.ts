/**
 * Ours (glue): iCalendar (RFC 5545) export and import for calendar events, in the browser, with no extra service.
 * Export writes VEVENTs (UTC times, or whole days for all-day events, ATTENDEEs and the repeat rule). Import reads VEVENTs:
 * UTC, floating and TZID times, whole days, DURATION, ATTENDEE, RRULE (supported subset only). Not imported: alarms,
 * attachments, exceptions of a repeating event (EXDATE / RECURRENCE-ID) and cancelled events.
 */
import { formatUtc, parseRule } from './recurrence';

export interface IcsAttendee {
  handle: string;
  displayName?: string;
}

export interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  /** for all-day events: midnight of the day after the last day (exclusive, as the app stores it) */
  end: Date;
  isAllDay: boolean;
  attendees: IcsAttendee[];
  /** RRULE text without the "RRULE:" prefix */
  rrule?: string;
}

export interface ParsedIcsEvent extends IcsEvent {
  /** set when the file had a repeat rule this app cannot represent; the event is imported as a single one */
  rruleUnsupported?: boolean;
}

export interface ParsedIcs {
  events: ParsedIcsEvent[];
  /** problems worth telling the person (skipped or simplified events) */
  warnings: string[];
}

export const ICS_MAX_BYTES = 1_000_000;
export const ICS_MAX_EVENTS = 500;

const CRLF = '\r\n';
const pad = (n: number, width = 2) => String(n).padStart(width, '0');

const escapeText = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');

const unescapeText = (value: string): string =>
  value.replace(/\\([nN,;\\])/g, (_m, c: string) => (c === 'n' || c === 'N' ? '\n' : c));

const dateOnly = (d: Date): string => `${pad(d.getFullYear(), 4)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

/** Fold a content line to 75 octets (UTF-8) per line, continuation lines start with one space. */
export const foldLine = (line: string): string => {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
      limit = 74; // the leading space of a continuation line counts as one octet
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join(CRLF + ' ');
};

export const buildIcs = (events: IcsEvent[], now: Date = new Date()): string => {
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Calendar//Calendar export//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const stamp = formatUtc(now);
  for (const event of events) {
    lines.push('BEGIN:VEVENT', `UID:${event.uid}`, `DTSTAMP:${stamp}`);
    if (event.isAllDay) {
      const startDay = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
      let endDay = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate());
      if (endDay.getTime() <= startDay.getTime()) endDay = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${dateOnly(startDay)}`, `DTEND;VALUE=DATE:${dateOnly(endDay)}`);
    } else {
      lines.push(`DTSTART:${formatUtc(event.start)}`, `DTEND:${formatUtc(event.end)}`);
    }
    lines.push(`SUMMARY:${escapeText(event.title || '(no title)')}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    if (event.rrule) lines.push(`RRULE:${event.rrule}`);
    for (const attendee of event.attendees) {
      const cn = attendee.displayName && attendee.displayName !== attendee.handle ? `;CN="${attendee.displayName.replace(/"/g, "'")}"` : '';
      lines.push(`ATTENDEE${cn}:mailto:${attendee.handle}`);
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
};

/* ---------- import ---------- */

interface Property {
  name: string;
  params: Record<string, string>;
  value: string;
}

const parseProperty = (line: string): Property | null => {
  // split name+params from the value at the first colon that is not inside a quoted parameter value
  let inQuotes = false;
  let colon = -1;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ':' && !inQuotes) {
      colon = i;
      break;
    }
  }
  if (colon < 1) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const pieces: string[] = [];
  let piece = '';
  inQuotes = false;
  for (const c of head) {
    if (c === '"') inQuotes = !inQuotes;
    if (c === ';' && !inQuotes) {
      pieces.push(piece);
      piece = '';
    } else piece += c;
  }
  pieces.push(piece);
  const name = pieces[0].toUpperCase();
  const params: Record<string, string> = {};
  for (const p of pieces.slice(1)) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name, params, value };
};

/** The instant at which `zone` shows this wall-clock time (null for an unknown zone). */
const zonedToInstant = (y: number, mo: number, d: number, h: number, mi: number, s: number, zone: string): Date | null => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    const wall = Date.UTC(y, mo - 1, d, h, mi, s);
    let guess = wall;
    for (let i = 0; i < 2; i += 1) {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((p) => [p.type, Number(p.value)]));
      const shown = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
      guess += wall - shown;
    }
    return new Date(guess);
  } catch {
    return null;
  }
};

interface ParsedWhen {
  date: Date;
  allDay: boolean;
  zoneUnknown?: boolean;
}

const parseWhen = (prop: Property): ParsedWhen | null => {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(prop.value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi, s, z] = m.slice(1);
  const [Y, MO, D] = [Number(y), Number(mo), Number(d)];
  if (h === undefined) return { date: new Date(Y, MO - 1, D), allDay: true };
  const [H, MI, S] = [Number(h), Number(mi), Number(s)];
  if (z) return { date: new Date(Date.UTC(Y, MO - 1, D, H, MI, S)), allDay: false };
  const zone = prop.params.TZID;
  if (zone) {
    const instant = zonedToInstant(Y, MO, D, H, MI, S, zone);
    if (instant) return { date: instant, allDay: false };
    return { date: new Date(Y, MO - 1, D, H, MI, S), allDay: false, zoneUnknown: true };
  }
  return { date: new Date(Y, MO - 1, D, H, MI, S), allDay: false }; // floating time: the viewer's own zone
};

const parseDuration = (value: string): number | null => {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value.trim());
  if (!m || value.trim() === 'P') return null;
  const sign = m[1] === '-' ? -1 : 1;
  const [w, d, h, mi, s] = m.slice(2).map((x) => Number(x ?? 0));
  return sign * ((((w * 7 + d) * 24 + h) * 60 + mi) * 60 + s) * 1000;
};

export const parseIcs = (text: string): ParsedIcs => {
  const warnings: string[] = [];
  const events: ParsedIcsEvent[] = [];
  if (new TextEncoder().encode(text).length > ICS_MAX_BYTES) {
    return { events, warnings: [`The file is larger than ${Math.round(ICS_MAX_BYTES / 1000)} KB and was not read.`] };
  }
  const lines = text.replace(/\r\n[ \t]|\n[ \t]/g, '').split(/\r\n|\n|\r/);
  let current: Property[] | null = null;
  let depth = 0; // VALARM and other nested components inside a VEVENT are skipped
  let skippedCancelled = 0;
  let skippedBroken = 0;
  let simplifiedRepeat = 0;
  let exceptions = 0;
  let unknownZone = 0;

  const finish = (props: Property[]) => {
    const get = (name: string) => props.find((p) => p.name === name);
    if (get('STATUS')?.value.trim().toUpperCase() === 'CANCELLED') {
      skippedCancelled += 1;
      return;
    }
    if (get('RECURRENCE-ID')) {
      exceptions += 1; // an edited single occurrence of a series: not supported
      return;
    }
    const startProp = get('DTSTART');
    const start = startProp ? parseWhen(startProp) : null;
    if (!start) {
      skippedBroken += 1;
      return;
    }
    if (start.zoneUnknown) unknownZone += 1;
    let end: Date;
    const endProp = get('DTEND');
    const durationProp = get('DURATION');
    if (endProp) {
      const parsedEnd = parseWhen(endProp);
      if (!parsedEnd) {
        skippedBroken += 1;
        return;
      }
      end = parsedEnd.date; // DTEND of a whole-day event is exclusive, which is also how the app stores it
    } else if (durationProp) {
      const ms = parseDuration(durationProp.value);
      if (ms === null) {
        skippedBroken += 1;
        return;
      }
      end = start.allDay ? new Date(start.date.getFullYear(), start.date.getMonth(), start.date.getDate() + Math.max(1, Math.ceil(ms / 86_400_000))) : new Date(start.date.getTime() + ms);
    } else {
      end = start.allDay ? new Date(start.date.getFullYear(), start.date.getMonth(), start.date.getDate() + 1) : start.date;
    }
    if (end.getTime() < start.date.getTime()) end = start.date;

    const rruleText = get('RRULE')?.value.trim();
    const rule = rruleText ? parseRule(rruleText) : null;
    const event: ParsedIcsEvent = {
      uid: get('UID')?.value.trim() || '',
      title: unescapeText(get('SUMMARY')?.value ?? '').trim() || '(no title)',
      description: get('DESCRIPTION') ? unescapeText(get('DESCRIPTION')!.value) : undefined,
      location: get('LOCATION') ? unescapeText(get('LOCATION')!.value) : undefined,
      start: start.date,
      end,
      isAllDay: start.allDay,
      attendees: props
        .filter((p) => p.name === 'ATTENDEE')
        .map((p) => ({ handle: p.value.replace(/^mailto:/i, '').trim().toLowerCase(), displayName: p.params.CN || undefined }))
        .filter((a) => a.handle.includes('@')),
      rrule: rule ? rruleText : undefined
    };
    if (rruleText && !rule) {
      event.rruleUnsupported = true;
      simplifiedRepeat += 1;
    }
    events.push(event);
  };

  for (const line of lines) {
    if (!line) continue;
    const upper = line.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      current = [];
      depth = 0;
    } else if (upper === 'END:VEVENT') {
      if (current) finish(current);
      current = null;
    } else if (current) {
      if (upper.startsWith('BEGIN:')) depth += 1;
      else if (upper.startsWith('END:')) depth -= 1;
      else if (depth === 0) {
        const prop = parseProperty(line);
        if (prop) current.push(prop);
      }
    }
    if (events.length > ICS_MAX_EVENTS) {
      return { events: events.slice(0, ICS_MAX_EVENTS), warnings: [`Only the first ${ICS_MAX_EVENTS} events were read.`] };
    }
  }

  if (skippedCancelled) warnings.push(`${skippedCancelled} cancelled event${skippedCancelled === 1 ? '' : 's'} skipped.`);
  if (skippedBroken) warnings.push(`${skippedBroken} event${skippedBroken === 1 ? '' : 's'} without a readable start or end skipped.`);
  if (exceptions) warnings.push(`${exceptions} edited occurrence${exceptions === 1 ? '' : 's'} of repeating events skipped (not supported).`);
  if (simplifiedRepeat) warnings.push(`${simplifiedRepeat} repeating event${simplifiedRepeat === 1 ? ' uses' : 's use'} a repeat rule this app does not support and will be imported once.`);
  if (unknownZone) warnings.push(`${unknownZone} event${unknownZone === 1 ? ' has' : 's have'} an unknown time zone; the time is read as your local time.`);
  return { events, warnings };
};
