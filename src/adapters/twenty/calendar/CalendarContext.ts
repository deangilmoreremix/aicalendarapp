import { createContext } from 'react';

import { type TimelineCalendarEvent } from './types';

type CalendarContextValue = {
  calendarEventsByDayTime: Record<number, TimelineCalendarEvent[] | undefined>;
};

export const CalendarContext = createContext<CalendarContextValue>({
  calendarEventsByDayTime: {},
});