/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/utils/getCalendarEventDatesAfterModeChange.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import { Temporal } from 'temporal-polyfill';

export const getCalendarEventDatesAfterModeChange = ({
  dates,
  isFullDay,
  timeZone,
}: {
  dates: { startsAt: string; endsAt: string };
  isFullDay: boolean;
  timeZone: string;
}) => {
  if (isFullDay) {
    const startDate = Temporal.Instant.from(dates.startsAt)
      .toZonedDateTimeISO(timeZone)
      .toPlainDate();

    return {
      startsAt: startDate.toString(),
      endsAt: startDate.add({ days: 1 }).toString(),
    };
  }

  const startDate = Temporal.PlainDate.from(dates.startsAt.slice(0, 10));
  const startsAt = startDate.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from('09:00'),
  });

  return {
    startsAt: startsAt.toInstant().toString(),
    endsAt: startsAt.add({ hours: 1 }).toInstant().toString(),
  };
};
