import { differenceInSeconds, endOfDay, format } from 'date-fns';
import { useContext } from 'react';

import { CalendarEventRowAdapter } from './CalendarEventRowAdapter';
import { CalendarContext } from './CalendarContext';
import { type TimelineCalendarEvent } from './types';

type CalendarDayCardContentProps = {
  calendarEvents: TimelineCalendarEvent[];
  divider?: boolean;
};

export const CalendarDayCardContentAdapter = ({
  calendarEvents,
  divider,
}: CalendarDayCardContentProps) => {
  const { calendarEventsByDayTime } = useContext(CalendarContext);
  const endOfDayDate = endOfDay(new Date(calendarEvents[0]?.startsAt || Date.now()));
  const dayEndsIn = differenceInSeconds(endOfDayDate, Date.now());

  const weekDayLabel = format(endOfDayDate, 'EE');
  const monthDayLabel = format(endOfDayDate, 'dd');

  const isEnded = dayEndsIn <= 0;

  return (
    <div className="flex flex-row gap-3 p-2">
      <div
        className={`flex-1 p-3 rounded transition-colors duration-200 ${
          isEnded ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
        } ${divider ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className="text-center w-6">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {weekDayLabel}
            </div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {monthDayLabel}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {calendarEvents.map((calendarEvent) => (
              <div key={calendarEvent.id} className="flex-1">
                <CalendarEventRowAdapter calendarEvent={calendarEvent} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};