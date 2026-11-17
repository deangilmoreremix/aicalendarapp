/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarEventRow.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';

import { CalendarEventNotSharedContent } from './CalendarEventNotSharedContent';
import { CalendarEventParticipantsAvatarGroup } from './CalendarEventParticipantsAvatarGroup';
import { getCalendarEventEndDate } from '../../vendor/twenty/calendar/utils/getCalendarEventEndDate';
import { getCalendarEventStartDate } from '../../vendor/twenty/calendar/utils/getCalendarEventStartDate';
import { hasCalendarEventEnded } from '../../vendor/twenty/calendar/utils/hasCalendarEventEnded';
import {
  CalendarChannelVisibility,
  type TimelineCalendarEvent
} from '../../vendor/twenty/calendar/types/generated';

type CalendarEventRowProps = {
  calendarEvent: TimelineCalendarEvent;
  className?: string;
  onOpenEvent?: (calendarEventId: string) => void;
};

export const CalendarEventRow = ({ calendarEvent, className, onOpenEvent }: CalendarEventRowProps) => {
  const startsAt = getCalendarEventStartDate(calendarEvent);
  const endsAt = getCalendarEventEndDate(calendarEvent);
  const hasEnded = hasCalendarEventEnded(calendarEvent);

  const startTimeLabel = calendarEvent.isFullDay ? 'All day' : format(startsAt, 'HH:mm');
  const endTimeLabel = calendarEvent.isFullDay ? '' : format(endsAt, 'HH:mm');

  // Upstream marks events the current workspace member attends; this app has no workspace members,
  // so the indicator highlights events that have not ended yet.
  const isActive = !hasEnded;
  const showTitle = calendarEvent.visibility === CalendarChannelVisibility.SHARE_EVERYTHING;

  return (
    <div
      className={`relative flex h-6 items-center gap-3 ${showTitle ? 'cursor-pointer' : 'cursor-not-allowed'} ${className ?? ''}`}
      onClick={showTitle ? () => onOpenEvent?.(calendarEvent.id) : undefined}
    >
      <div className={`h-full w-1 rounded-sm ${isActive ? 'bg-red-500' : 'bg-gray-400'}`} />
      <div className="flex flex-1 items-center gap-2 text-gray-900 dark:text-gray-100">
        <div className="flex w-26 items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          {startTimeLabel}
          {endTimeLabel && (
            <>
              <ArrowRight size={14} />
              {endTimeLabel}
            </>
          )}
        </div>
        {showTitle ? (
          <div
            className={`w-10 flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
              hasEnded ? '' : 'font-medium'
            } ${calendarEvent.isCanceled ? 'line-through' : ''}`}
          >
            {calendarEvent.title}
          </div>
        ) : (
          <CalendarEventNotSharedContent />
        )}
      </div>
      {!!calendarEvent.participants?.length && (
        <CalendarEventParticipantsAvatarGroup participants={calendarEvent.participants} />
      )}
    </div>
  );
};
