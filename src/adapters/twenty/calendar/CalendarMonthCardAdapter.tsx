import { useContext } from 'react';

import { CalendarDayCardContentAdapter } from './CalendarDayCardContentAdapter';
import { CalendarContext } from './CalendarContext';

type CalendarMonthCardProps = {
  dayTimes: number[];
};

export const CalendarMonthCardAdapter = ({ dayTimes }: CalendarMonthCardProps) => {
  const { calendarEventsByDayTime } = useContext(CalendarContext);

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow">
      {dayTimes.map((dayTime, index) => {
        const dayCalendarEvents = calendarEventsByDayTime[dayTime] || [];

        return (
          <CalendarDayCardContentAdapter
            key={dayTime}
            calendarEvents={dayCalendarEvents}
            divider={index < dayTimes.length - 1}
          />
        );
      })}
    </div>
  );
};