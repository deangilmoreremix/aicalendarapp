/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-import-manager/utils/filter-events-and-return-events-to-remove.util.ts
 * Changes: import paths. Logic unchanged.
 */
import { filterOutBlocklistedEvents } from './filter-out-blocklisted-events.util';
import { type FetchedCalendarEvent } from './types/fetched-calendar-event.type';

export const filterEventsAndReturnEventsToRemove = (
  calendarChannelHandles: string[],
  events: FetchedCalendarEvent[],
  blocklist: string[],
  excludePrivateEvents: boolean,
): {
  filteredEvents: FetchedCalendarEvent[];
  eventsToRemove: FetchedCalendarEvent[];
} => {
  const filteredEvents = filterOutBlocklistedEvents(
    calendarChannelHandles,
    events,
    blocklist,
  );

  return filteredEvents.reduce(
    (
      acc: {
        filteredEvents: FetchedCalendarEvent[];
        eventsToRemove: FetchedCalendarEvent[];
      },
      event,
    ) => {
      if (event.isCanceled || (excludePrivateEvents && event.isPrivate)) {
        acc.eventsToRemove.push(event);
      } else {
        acc.filteredEvents.push(event);
      }

      return acc;
    },
    {
      filteredEvents: [],
      eventsToRemove: [],
    },
  );
};
