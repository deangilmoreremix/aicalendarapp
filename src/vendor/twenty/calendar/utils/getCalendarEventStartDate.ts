/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/utils/getCalendarEventStartDate.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import { type CalendarEvent } from '../types/CalendarEvent';

export const getCalendarEventStartDate = (
  calendarEvent: Pick<CalendarEvent, 'startsAt'>,
) => new Date(calendarEvent.startsAt);
