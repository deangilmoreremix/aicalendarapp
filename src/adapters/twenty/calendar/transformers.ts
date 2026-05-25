/**
 * Pure data transformers for Twenty calendar concepts.
 *
 * These are designed to be used to ENRICH the existing AI Calendar app
 * without replacing any of its UI or components.
 *
 * All final rendering must continue to use the AI Calendar's own design system.
 */

import { type TaskEvent } from '../../components/BigTaskCalendar'; // temporary - will be cleaned when we move types
import { type TimelineCalendarEvent, type TimelineCalendarEventParticipant } from './types';
import { CalendarEvent, Task } from '../../../types';

/**
 * Converts an AI Calendar event (TaskEvent or raw CalendarEvent) into the richer
 * Twenty TimelineCalendarEvent model.
 *
 * This function is PURE and can be used internally to prepare better data
 * for the existing react-big-calendar, modals, activity feed, etc.
 */
export function toTimelineCalendarEvent(
  event: TaskEvent | { id: string; title: string; start: Date; end?: Date; allDay?: boolean; resource?: any }
): TimelineCalendarEvent {
  const isTaskEvent = 'resource' in event && event.resource?.type === 'task';
  const data = isTaskEvent ? event.resource?.data : (event as any).resource?.data;

  const participants: TimelineCalendarEventParticipant[] =
    data?.attendees?.map((attendee: string) => ({
      firstName: '',
      lastName: '',
      displayName: attendee,
    })) || [];

  // If the event already carries richer participant data (future state)
  if (data?.participants && Array.isArray(data.participants)) {
    // merge richer data if present
  }

  return {
    id: event.id,
    title: event.title,
    startsAt: event.start.toISOString(),
    endsAt: event.end?.toISOString(),
    isFullDay: !!event.allDay,
    description: data?.description,
    location: data?.location,
    conferenceSolution: data?.conferenceSolution,
    conferenceLink: data?.conferenceLink,
    visibility: data?.visibility || 'SHARE_EVERYTHING',
    isCanceled: data?.isCanceled || false,
    participants,
  };
}

/**
 * Groups an array of TimelineCalendarEvent by day (midnight timestamp).
 * Useful for timeline-style sorting or sections inside existing AI Calendar UI.
 */
export function groupTimelineEventsByDay(
  events: TimelineCalendarEvent[]
): Record<number, TimelineCalendarEvent[]> {
  const grouped: Record<number, TimelineCalendarEvent[]> = {};

  events.forEach((event) => {
    const dayTime = new Date(event.startsAt).setHours(0, 0, 0, 0);
    if (!grouped[dayTime]) {
      grouped[dayTime] = [];
    }
    grouped[dayTime].push(event);
  });

  return grouped;
}

/**
 * Generates an array of day timestamps (midnight) for a given month.
 * Can be used for pre-computing sections in lists or calendars.
 */
export function getDayTimesForMonth(date: Date): number[] {
  const days: number[] = [];
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d).setHours(0, 0, 0, 0));
  }

  return days;
}

/**
 * Converts a list of raw AI Calendar events into TimelineCalendarEvents.
 * This is the main entry point for enriching data inside the existing app.
 */
export function convertEventsToTimelineFormat(
  events: TaskEvent[]
): TimelineCalendarEvent[] {
  return events.map((event) => toTimelineCalendarEvent(event));
}
