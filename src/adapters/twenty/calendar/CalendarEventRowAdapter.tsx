import { format } from 'date-fns';
import { ChevronRight, Users } from 'lucide-react';

import { type TimelineCalendarEvent } from './types';

type CalendarEventRowProps = {
  calendarEvent: TimelineCalendarEvent;
  className?: string;
};

export const CalendarEventRowAdapter = ({
  calendarEvent,
  className,
}: CalendarEventRowProps) => {
  const startsAt = new Date(calendarEvent.startsAt);
  const endsAt = calendarEvent.endsAt ? new Date(calendarEvent.endsAt) : null;
  const hasEnded = endsAt ? endsAt < new Date() : false;

  const startTimeLabel = calendarEvent.isFullDay
    ? 'All day'
    : format(startsAt, 'HH:mm');
  const endTimeLabel = calendarEvent.isFullDay ? '' : endsAt ? format(endsAt, 'HH:mm') : '';

  const showTitle = calendarEvent.visibility === 'SHARE_EVERYTHING';

  return (
    <div
      className={`flex items-center gap-3 h-6 cursor-pointer ${className || ''}`}
      onClick={showTitle ? () => console.log('Open event', calendarEvent.id) : undefined}
    >
      <div
        className={`w-1 rounded-sm h-full ${
          calendarEvent.participants?.length ? 'bg-red-500' : 'bg-gray-400'
        }`}
      />
      <div className="flex items-center flex-1 gap-2 text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-1 w-26 text-gray-500 dark:text-gray-400 text-sm">
          {startTimeLabel}
          {endTimeLabel && (
            <>
              <ChevronRight size={12} />
              {endTimeLabel}
            </>
          )}
        </div>
        {showTitle ? (
          <div
            className={`flex-1 font-medium overflow-hidden text-ellipsis whitespace-nowrap ${
              hasEnded ? 'text-gray-500' : ''
            } ${calendarEvent.isCanceled ? 'line-through' : ''}`}
          >
            {calendarEvent.title}
          </div>
        ) : (
          <div className="flex-1 text-gray-500 dark:text-gray-400">
            Event not shared
          </div>
        )}
      </div>
      {calendarEvent.participants && calendarEvent.participants.length > 0 && (
        <div className="flex items-center gap-1">
          <Users size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">{calendarEvent.participants.length}</span>
        </div>
      )}
    </div>
  );
};