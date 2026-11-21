/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarEventsCard.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarPlus, Download, Link2 } from 'lucide-react';
import { buildIcs } from '../../lib/calendar/ics';
import { downloadTextFile, timelineEventsToIcs } from '../../lib/calendar/icsEvents';

import { CalendarEventsCardContent } from './CalendarEventsCardContent';
import { CalendarEventComposerModal, type CalendarComposerContext } from './CalendarEventComposerModal';
import { CalendarEventDetailsModal } from './CalendarEventDetailsModal';
import { LinkCalendarEventsDialog } from './LinkCalendarEventsDialog';
import { TIMELINE_CALENDAR_EVENTS_DEFAULT_PAGE_SIZE } from '../../vendor/twenty/calendar/constants/Calendar';
import { type TimelineCalendarEvent } from '../../vendor/twenty/calendar/types/generated';
import { calendarEventApi, type CalendarTargetType } from '../../services/api';
import { useTaskStore } from '../../store/taskStore';
import { CALENDAR_BLOCKLIST_CHANGED, CALENDAR_DATA_CHANGED } from '../../lib/calendarPreferences';

type CalendarEventsCardProps = {
  targetType: CalendarTargetType;
  targetId: string;
  /** Used in the empty-state copy, e.g. "contact" */
  objectName: string;
  /** Pre-fills the composer (guest, linked record) */
  composerContext?: CalendarComposerContext;
};

/** Reload signals that arrive within this time of each other cause a single reload of the timeline. */
const TIMELINE_RELOAD_DEBOUNCE_MS = 150;

const EXPORT_TIMEOUT_MS = 60_000;
/** Rejects if the work takes longer than `ms`, so a hung request cannot leave Export stuck. */
const withTimeout = <T,>(work: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Export timed out')), ms);
    work.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });

export const CalendarEventsCard = ({ targetType, targetId, objectName, composerContext }: CalendarEventsCardProps) => {
  const [events, setEvents] = useState<TimelineCalendarEvent[] | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [firstQueryLoading, setFirstQueryLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [openedEventId, setOpenedEventId] = useState<string | null>(null);

  // every (re)load starts a new generation: an older first page or a pagination page that finishes later is dropped
  const generation = useRef(0);

  const load = useCallback(async () => {
    const mine = ++generation.current;
    setFirstQueryLoading(true);
    setError(null);
    try {
      const result = await calendarEventApi.getTimeline(targetType, targetId, TIMELINE_CALENDAR_EVENTS_DEFAULT_PAGE_SIZE, 0);
      if (mine !== generation.current) return;
      setEvents(result.timelineCalendarEvents);
      setTotal(result.totalNumberOfCalendarEvents);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      if (mine === generation.current) setError('Could not load calendar events.');
    } finally {
      if (mine === generation.current) setFirstQueryLoading(false);
    }
  }, [targetType, targetId]);

  // a different record starts empty, so nothing of the previous record can be shown or exported while it loads
  useEffect(() => {
    setEvents(undefined);
    setTotal(0);
    void load();
  }, [load]);

  // the blocklist decides which events this timeline shows, and events, guests and links can change elsewhere.
  // A burst of such signals (one per changed table, one per imported contact) is collapsed into one reload.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reload = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        void load();
      }, TIMELINE_RELOAD_DEBOUNCE_MS);
    };
    window.addEventListener(CALENDAR_BLOCKLIST_CHANGED, reload);
    window.addEventListener(CALENDAR_DATA_CHANGED, reload);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener(CALENDAR_BLOCKLIST_CHANGED, reload);
      window.removeEventListener(CALENDAR_DATA_CHANGED, reload);
    };
  }, [load]);

  // Same "has more" rule as upstream
  const hasMoreCalendarEvents = events && total ? events.length < total : false;

  const handleLastRowVisible = async () => {
    if (!hasMoreCalendarEvents || isFetchingMore) return;
    const mine = generation.current; // a reload while this page is loading makes it out of date
    setIsFetchingMore(true);
    try {
      const result = await calendarEventApi.getTimeline(
        targetType,
        targetId,
        TIMELINE_CALENDAR_EVENTS_DEFAULT_PAGE_SIZE,
        events?.length ?? 0
      );
      if (mine !== generation.current) return;
      setEvents((current) => [...(current ?? []), ...result.timelineCalendarEvents]);
      setTotal(result.totalNumberOfCalendarEvents);
    } catch (err) {
      console.error('Failed to load more calendar events:', err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const [exporting, setExporting] = useState(false);
  const exportEvents = async () => {
    setExporting(true);
    setError(null);
    try {
      await withTimeout((async () => {
      // every page of this record's events, whatever is loaded for display (the card shows 10 at a time)
      const all: TimelineCalendarEvent[] = [];
      const PAGE = 100;
      for (let page = 0; page < 100; page += 1) {
        const result = await calendarEventApi.getTimeline(targetType, targetId, PAGE, all.length);
        all.push(...result.timelineCalendarEvents);
        if (result.timelineCalendarEvents.length < PAGE || all.length >= result.totalNumberOfCalendarEvents) break;
        if (page === 99) throw new Error('Too many events to export at once');
      }
      const details = await calendarEventApi.getExportDetails(all.map((e) => e.id));
      const icsEvents = timelineEventsToIcs(all, details);
      if (icsEvents.length === 0) {
        setError('None of these events can be exported (their details are not shared with you).');
        return;
      }
      downloadTextFile(`${objectName || 'calendar'}-events.ics`, buildIcs(icsEvents));
      })(), EXPORT_TIMEOUT_MS);
    } catch (err) {
      console.error('Failed to export calendar events:', err);
      setError('Could not export the events.');
    } finally {
      setExporting(false);
    }
  };

  const openedEvent = events?.find((event) => event.id === openedEventId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Calendar {total > 0 && <span className="text-sm font-normal text-gray-500">({total})</span>}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void exportEvents()}
            disabled={exporting || !events || events.length === 0}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsLinkOpen(true)}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Link2 className="mr-2 h-4 w-4" />
            Link event
          </button>
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            New event
          </button>
        </div>
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

      {/* mounted only while open, so every new event starts from empty fields */}
      {isComposerOpen && (
        <CalendarEventComposerModal
          isOpen
          onClose={() => setIsComposerOpen(false)}
          onCreated={() => {
            void load();
            // the main calendar may be open behind this card: refresh its events too
            void useTaskStore.getState().reloadCalendarEvents();
          }}
          context={composerContext ?? { targets: [{ type: targetType, id: targetId }] }}
        />
      )}
      {isLinkOpen && (
        <LinkCalendarEventsDialog
          targetType={targetType}
          targetId={targetId}
          onClose={() => setIsLinkOpen(false)}
          onLinked={() => void load()}
        />
      )}
      <CalendarEventDetailsModal event={openedEvent} onClose={() => setOpenedEventId(null)} />
    </div>
  );
};
