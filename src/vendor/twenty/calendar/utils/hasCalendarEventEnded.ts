/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/utils/hasCalendarEventEnded.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import { isPast } from 'date-fns';

import { type CalendarEvent } from '../types/CalendarEvent';
import { getCalendarEventEndDate } from './getCalendarEventEndDate';

export const hasCalendarEventEnded = (
  calendarEvent: Pick<CalendarEvent, 'endsAt' | 'isFullDay' | 'startsAt'>,
) => isPast(getCalendarEventEndDate(calendarEvent));
