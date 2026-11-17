/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarMonthCard.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { useContext } from 'react';

import { CalendarDayCardContent } from './CalendarDayCardContent';
import { CalendarContext } from './CalendarContext';

type CalendarMonthCardProps = {
  dayTimes: number[];
  onOpenEvent?: (calendarEventId: string) => void;
};

export const CalendarMonthCard = ({ dayTimes, onOpenEvent }: CalendarMonthCardProps) => {
  const { calendarEventsByDayTime } = useContext(CalendarContext);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {dayTimes.map((dayTime, index) => {
        const dayCalendarEvents = calendarEventsByDayTime[dayTime] || [];

        return (
          <CalendarDayCardContent
            key={dayTime}
            calendarEvents={dayCalendarEvents}
            divider={index < dayTimes.length - 1}
            onOpenEvent={onOpenEvent}
          />
        );
      })}
    </div>
  );
};
