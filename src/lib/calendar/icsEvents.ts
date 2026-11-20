/**
 * Ours (glue): between the app's calendar events and the .ics library (src/lib/calendar/ics.ts).
 */
import type { CalendarEvent } from '../../types';
import type { CreateCalendarEventInput } from '../../services/api';
import { CalendarChannelVisibility } from '../../vendor/twenty/calendar/shared/CalendarChannelVisibility';
import type { TimelineCalendarEvent } from '../../vendor/twenty/calendar/types/generated';
import type { IcsEvent, ParsedIcsEvent } from './ics';

/** The zone repeating timed events are written in: the one the calendar works out their occurrences in (the viewer's). */
const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;

const localDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Calendar events as .ics events. A repeating event is written once (with its rule), not once per occurrence. */
export const calendarEventsToIcs = (events: CalendarEvent[]): IcsEvent[] => {
  const seen = new Set<string>();
  const out: IcsEvent[] = [];
  for (const event of events) {
    const stored = event.seriesId ?? event.id;
    if (seen.has(stored)) continue;
    seen.add(stored);
    out.push({
      uid: event.icalUid || `${stored}@aicalendar`,
      title: event.title,
      description: event.description,
      location: event.location,
      start: event.seriesStartDate ?? event.startDate,
      end: event.seriesEndDate ?? event.endDate,
      isAllDay: event.isAllDay,
      rrule: event.recurrenceRule,
      timeZone: event.recurrenceRule && !event.isAllDay ? viewerTimeZone() : undefined,
      attendees: (event.participants ?? []).filter((p) => p.handle).map((p) => ({ handle: p.handle as string, displayName: p.displayName }))
    });
  }
  return out;
};

/** What a record's timeline response does not carry, read from the stored events (see calendarEventApi.getExportDetails). */
export type ExportDetails = Map<string, { recurrenceRule?: string; icalUid?: string }>;

/**
 * A record's timeline events as .ics events. Events whose details are not shared with the viewer (no title) are left out.
 * `details` supplies the repeat rule and the UID an imported event came with, so a repeating event is written once, with
 * its rule, and re-importing the file does not create duplicates.
 */
export const timelineEventsToIcs = (events: TimelineCalendarEvent[], details: ExportDetails = new Map()): IcsEvent[] =>
  events
    .filter((e) => e.title !== undefined && e.title !== null)
    .map((e) => {
      const start = new Date(e.startsAt);
      const end = e.endsAt ? new Date(e.endsAt) : start;
      const extra = details.get(e.id);
      return {
        uid: extra?.icalUid || `${e.id}@aicalendar`,
        title: e.title as string,
        description: e.description,
        location: e.location,
        start,
        end,
        isAllDay: e.isFullDay,
        rrule: extra?.recurrenceRule,
        timeZone: extra?.recurrenceRule && !e.isFullDay ? viewerTimeZone() : undefined,
        attendees: (e.participants ?? []).filter((p) => p.handle).map((p) => ({ handle: p.handle, displayName: p.displayName }))
      };
    });

/** The payload for calendarEventApi.create from an imported event (times are saved in the viewer's time zone). */
export const parsedIcsToCreateInput = (
  event: ParsedIcsEvent,
  timeZone: string,
  visibility: CalendarChannelVisibility = CalendarChannelVisibility.SHARE_EVERYTHING
): CreateCalendarEventInput => ({
  title: event.title,
  description: event.description,
  location: event.location,
  startsAt: event.isAllDay ? localDateString(event.start) : event.start.toISOString(),
  endsAt: event.isAllDay ? localDateString(event.end) : event.end.toISOString(),
  isFullDay: event.isAllDay,
  timeZone,
  visibility,
  recurrenceRule: event.rrule,
  icalUid: event.uid || undefined,
  attendees: event.attendees.map((a) => ({ handle: a.handle, displayName: a.displayName })),
  targets: []
});

/** Save text as a file through the browser. */
export const downloadTextFile = (fileName: string, text: string, mime = 'text/calendar;charset=utf-8') => {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
