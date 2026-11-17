/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-import-manager/utils/filter-out-blocklisted-events.util.ts
 * Changes: import paths. Logic unchanged.
 */
import { isEmailBlocklisted } from './is-email-blocklisted.util';
import { type FetchedCalendarEvent } from './types/fetched-calendar-event.type';

export const filterOutBlocklistedEvents = (
  calendarChannelHandles: string[],
  events: FetchedCalendarEvent[],
  blocklist: string[],
) => {
  return events.filter((event) => {
    if (!event.participants) {
      return true;
    }

    return event.participants.every(
      (attendee) =>
        !isEmailBlocklisted(calendarChannelHandles, attendee.handle, blocklist),
    );
  });
};
