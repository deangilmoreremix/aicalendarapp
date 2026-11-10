/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarEventsCard.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { useCallback, useEffect, useState } from 'react';
import { CalendarPlus } from 'lucide-react';

import { CalendarEventsCardContent } from './CalendarEventsCardContent';
import { CalendarEventComposerModal, type CalendarComposerContext } from './CalendarEventComposerModal';
import { CalendarEventDetailsModal } from './CalendarEventDetailsModal';
import { TIMELINE_CALENDAR_EVENTS_DEFAULT_PAGE_SIZE } from '../../vendor/twenty/calendar/constants/Calendar';
import { type TimelineCalendarEvent } from '../../vendor/twenty/calendar/types/generated';
import { calendarEventApi, type CalendarTargetType } from '../../services/api';

type CalendarEventsCardProps = {
  targetType: CalendarTargetType;
  targetId: string;
  /** Used in the empty-state copy, e.g. "contact" */
  objectName: string;
  /** Pre-fills the composer (guest, linked record) */
  composerContext?: CalendarComposerContext;
};

export const CalendarEventsCard = ({ targetType, targetId, objectName, composerContext }: CalendarEventsCardProps) => {
  const [events, setEvents] = useState<TimelineCalendarEvent[] | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [firstQueryLoading, setFirstQueryLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [openedEventId, setOpenedEventId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFirstQueryLoading(true);
    setError(null);
    try {
      const result = await calendarEventApi.getTimeline(targetType, targetId, TIMELINE_CALENDAR_EVENTS_DEFAULT_PAGE_SIZE, 0);
      setEvents(result.timelineCalendarEvents);
      setTotal(result.totalNumberOfCalendarEvents);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setError('Could not load calendar events.');
    } finally {
      setFirstQueryLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Same "has more" rule as upstream
  const hasMoreCalendarEvents = events && total ? events.length < total : false;

  const handleLastRowVisible = async () => {
    if (!hasMoreCalendarEvents || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const result = await calendarEventApi.getTimeline(
        targetType,
        targetId,
        TIMELINE_CALENDAR_EVENTS_DEFAULT_PAGE_SIZE,
        events?.length ?? 0
      );
      setEvents((current) => [...(current ?? []), ...result.timelineCalendarEvents]);
      setTotal(result.totalNumberOfCalendarEvents);
    } catch (err) {
      console.error('Failed to load more calendar events:', err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const openedEvent = events?.find((event) => event.id === openedEventId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Calendar {total > 0 && <span className="text-sm font-normal text-gray-500">({total})</span>}
        </h3>
        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          New event
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <CalendarEventsCardContent
        firstQueryLoading={firstQueryLoading}
        isFetchingMore={isFetchingMore}
        objectName={objectName}
        onLastRowVisible={handleLastRowVisible}
        onCreateEvent={() => setIsComposerOpen(true)}
        onOpenEvent={setOpenedEventId}
        timelineCalendarEvents={events}
      />

      <CalendarEventComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onCreated={() => void load()}
        context={composerContext ?? { targets: [{ type: targetType, id: targetId }] }}
      />
      <CalendarEventDetailsModal event={openedEvent} onClose={() => setOpenedEventId(null)} />
    </div>
  );
};
