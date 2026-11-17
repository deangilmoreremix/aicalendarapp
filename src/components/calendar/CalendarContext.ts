/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/contexts/CalendarContext.ts
 * Changes: import path only.
 */
import { createContext } from 'react';

import { type TimelineCalendarEvent } from '../../vendor/twenty/calendar/types/generated';

type CalendarContextValue = {
  calendarEventsByDayTime: Record<number, TimelineCalendarEvent[] | undefined>;
};

export const CalendarContext = createContext<CalendarContextValue>({
  calendarEventsByDayTime: {}
});
