import { createContext } from 'react';

import { type TimelineCalendarEvent } from './types';

/**
 * @deprecated
 * This context was created to support visual Twenty timeline components.
 * We now prefer pure transformers (see transformers.ts) for data enrichment
 * while keeping all rendering inside the AI Calendar design system.
 */
type CalendarContextValue = {
  calendarEventsByDayTime: Record<number, TimelineCalendarEvent[] | undefined>;
};

export const CalendarContext = createContext<CalendarContextValue>({
  calendarEventsByDayTime: {},
});