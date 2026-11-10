/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/utils/getCalendarEventComposerDefaultDates.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import type { Temporal } from 'temporal-polyfill';

const CALENDAR_EVENT_DEFAULT_DURATION_MINUTES = 60;
const CALENDAR_EVENT_START_INTERVAL_MINUTES = 30;

export const getCalendarEventComposerDefaultDates = ({
  now,
  timeZone,
}: {
  now: Temporal.Instant;
  timeZone: string;
}) => {
  const zonedNow = now.toZonedDateTimeISO(timeZone);
  const minutesUntilNextInterval =
    CALENDAR_EVENT_START_INTERVAL_MINUTES -
    (zonedNow.minute % CALENDAR_EVENT_START_INTERVAL_MINUTES);

  const startsAt = zonedNow
    .add({ minutes: minutesUntilNextInterval })
    .with({ second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });

  return {
    startsAt: startsAt.toInstant().toString(),
    endsAt: startsAt
      .add({ minutes: CALENDAR_EVENT_DEFAULT_DURATION_MINUTES })
      .toInstant()
      .toString(),
  };
};
