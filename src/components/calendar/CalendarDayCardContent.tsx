/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarDayCardContent.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { differenceInSeconds, endOfDay, format } from 'date-fns';

import { CalendarEventRow } from './CalendarEventRow';
import { getCalendarEventStartDate } from '../../vendor/twenty/calendar/utils/getCalendarEventStartDate';
import { type TimelineCalendarEvent } from '../../vendor/twenty/calendar/types/generated';

type CalendarDayCardContentProps = {
  calendarEvents: TimelineCalendarEvent[];
  divider?: boolean;
  onOpenEvent?: (calendarEventId: string) => void;
};

export const CalendarDayCardContent = ({ calendarEvents, divider, onOpenEvent }: CalendarDayCardContentProps) => {
  const endOfDayDate = endOfDay(getCalendarEventStartDate(calendarEvents[0]));
  const dayEndsIn = differenceInSeconds(endOfDayDate, Date.now());

  const weekDayLabel = format(endOfDayDate, 'EE');
  const monthDayLabel = format(endOfDayDate, 'dd');

  // Upstream animates the card to the "ended" background when the day is over; here it is simply applied.
  const isEnded = dayEndsIn <= 0;

  return (
    <div
      className={`flex flex-row items-start gap-3 px-3 py-2 transition-colors duration-200 ${
        isEnded ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
      } ${divider ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
    >
      <div className="w-6 text-center">
        <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{weekDayLabel}</div>
        <div className="font-medium text-gray-900 dark:text-gray-100">{monthDayLabel}</div>
      </div>
      <div className="flex flex-1 flex-col items-stretch gap-3">
        {calendarEvents.map((calendarEvent) => (
          <div key={calendarEvent.id} className="flex-1">
            <CalendarEventRow calendarEvent={calendarEvent} onOpenEvent={onOpenEvent} />
          </div>
        ))}
      </div>
    </div>
  );
};
