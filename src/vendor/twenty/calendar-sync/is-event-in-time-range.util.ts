/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-import-manager/drivers/caldav/utils/is-event-in-time-range.util.ts
 * Changes: import paths. Logic unchanged.
 */
import { isNonEmptyString } from '@sniptt/guards';

import { type FetchedCalendarEvent } from './types/fetched-calendar-event.type';

export const isEventInTimeRange = (
  event: Pick<FetchedCalendarEvent, 'startsAt' | 'endsAt'>,
  windowStart: Date,
  windowEnd: Date,
): boolean => {
  if (!isNonEmptyString(event.startsAt) || !isNonEmptyString(event.endsAt)) {
    return false;
  }

  const eventStart = new Date(event.startsAt);
  const eventEnd = new Date(event.endsAt);

  return eventStart < windowEnd && eventEnd > windowStart;
};
