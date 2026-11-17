/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/hooks/useCalendarEvents.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import { getYear, startOfDay, startOfMonth } from 'date-fns';

import { getCalendarEventStartDate } from '../utils/getCalendarEventStartDate';
import { type TimelineCalendarEvent } from '../types/generated';
import { groupArrayItemsBy } from '../shared/array/groupArrayItemsBy';
import { sortDesc } from '../shared/sort';

export const useCalendarEvents = (calendarEvents: TimelineCalendarEvent[]) => {
  const calendarEventsByDayTime = groupArrayItemsBy(
    calendarEvents,
    (calendarEvent) =>
      startOfDay(getCalendarEventStartDate(calendarEvent)).getTime(),
  );

  const sortedDayTimes = Object.keys(calendarEventsByDayTime)
    .map(Number)
    .sort(sortDesc);

  const daysByMonthTime = groupArrayItemsBy(sortedDayTimes, (dayTime) =>
    startOfMonth(dayTime).getTime(),
  );

  const sortedMonthTimes = Object.keys(daysByMonthTime)
    .map(Number)
    .sort(sortDesc);

  const monthTimesByYear = groupArrayItemsBy(sortedMonthTimes, getYear);

  return {
    calendarEventsByDayTime,
    daysByMonthTime,
    monthTimes: sortedMonthTimes,
    monthTimesByYear,
  };
};
