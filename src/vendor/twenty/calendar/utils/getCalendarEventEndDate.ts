/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/utils/getCalendarEventEndDate.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import { endOfDay } from 'date-fns';

import { type CalendarEvent } from '../types/CalendarEvent';
import { getCalendarEventStartDate } from './getCalendarEventStartDate';

export const getCalendarEventEndDate = (
  calendarEvent: Pick<CalendarEvent, 'endsAt' | 'isFullDay' | 'startsAt'>,
) =>
  calendarEvent.endsAt
    ? new Date(calendarEvent.endsAt)
    : endOfDay(getCalendarEventStartDate(calendarEvent));
