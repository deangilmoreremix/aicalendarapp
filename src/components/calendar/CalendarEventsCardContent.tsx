/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarEventsCardContent.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { format, getYear } from 'date-fns';
import { useEffect, useRef } from 'react';

import { CalendarEventsEmptyState } from './CalendarEventsEmptyState';
import { CalendarMonthCard } from './CalendarMonthCard';
import { CalendarContext } from './CalendarContext';
import { useCalendarEvents } from '../../vendor/twenty/calendar/hooks/useCalendarEvents';
import { type TimelineCalendarEvent } from '../../vendor/twenty/calendar/types/generated';

type CalendarEventsCardContentProps = {
  firstQueryLoading: boolean;
  isFetchingMore: boolean;
  objectName: string;
  onLastRowVisible: () => Promise<void>;
  onCreateEvent?: () => void;
  onOpenEvent?: (calendarEventId: string) => void;
  timelineCalendarEvents: TimelineCalendarEvent[] | undefined;
};

// Replaces upstream's CustomResolverFetchMoreLoader: fires when the sentinel scrolls into view.
const FetchMoreLoader = ({ loading, onLastRowVisible }: { loading: boolean; onLastRowVisible: () => Promise<void> }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !loading) {
        void onLastRowVisible();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, onLastRowVisible]);

  return (
    <div ref={ref} className="py-2 text-center text-sm text-gray-400">
      {loading ? 'Loading...' : ''}
    </div>
  );
};

export const CalendarEventsCardContent = ({
  firstQueryLoading,
  isFetchingMore,
  objectName,
  onLastRowVisible,
  onCreateEvent,
  onOpenEvent,
  timelineCalendarEvents
}: CalendarEventsCardContentProps) => {
  const { calendarEventsByDayTime, daysByMonthTime, monthTimes, monthTimesByYear } = useCalendarEvents(
    timelineCalendarEvents ?? []
  );

  if (firstQueryLoading) {
    return <div className="animate-pulse p-4 text-sm text-gray-400">Loading events...</div>;
  }

  if (!timelineCalendarEvents?.length) {
    return <CalendarEventsEmptyState objectName={objectName} onCreateEvent={onCreateEvent} />;
  }

  return (
    <CalendarContext.Provider value={{ calendarEventsByDayTime }}>
      <div className="flex flex-col gap-8">
        {monthTimes.map((monthTime) => {
          const monthDayTimes = daysByMonthTime[monthTime] || [];
          const year = getYear(monthTime);
          const lastMonthTimeOfYear = monthTimesByYear[year]?.[0];
          const isLastMonthOfYear = lastMonthTimeOfYear === monthTime;
          const monthLabel = format(monthTime, 'MMMM');

          return (
            <section key={monthTime}>
              <h3 className="mb-2 text-base font-normal text-gray-700 dark:text-gray-200">
                {monthLabel}
                {isLastMonthOfYear && <span className="text-gray-400"> {year}</span>}
              </h3>
              <CalendarMonthCard dayTimes={monthDayTimes} onOpenEvent={onOpenEvent} />
            </section>
          );
        })}
        <FetchMoreLoader loading={isFetchingMore} onLastRowVisible={onLastRowVisible} />
      </div>
    </CalendarContext.Provider>
  );
};
