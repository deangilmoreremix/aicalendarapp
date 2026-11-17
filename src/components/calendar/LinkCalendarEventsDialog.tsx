/**
 * Ours (glue): pick an existing calendar event and link it to a record. Twenty's `LinkCalendarEventsDropdown` offers
 * the same action in its record Calendar tab; the data here is the `calendar_event_targets` table.
 */
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Link2, X } from 'lucide-react';

import { Dialog, DialogContent } from '../ui/dialog';
import { calendarEventApi, type CalendarTargetType } from '../../services/api';
import type { CalendarEvent } from '../../types';

export const LinkCalendarEventsDialog = ({
  targetType,
  targetId,
  onClose,
  onLinked
}: {
  targetType: CalendarTargetType;
  targetId: string;
  onClose: () => void;
  onLinked: () => void;
}) => {
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const found = await calendarEventApi.searchLinkable({ type: targetType, id: targetId }, search);
        if (!cancelled) {
          setEvents(found);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to search events:', err);
        if (!cancelled) setError('Could not load events.');
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, targetType, targetId]);

  const link = async (event: CalendarEvent) => {
    setLinkingId(event.id);
    setError(null);
    try {
      await calendarEventApi.linkToRecord(event.id, { type: targetType, id: targetId });
      onLinked();
      onClose();
    } catch (err) {
      console.error('Failed to link event:', err);
      setError('Could not link the event.');
      setLinkingId(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <div className="space-y-3 p-6 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Link an existing event</h2>
              <p className="text-xs text-gray-500">Events that are not yet linked to this {targetType}, newest first.</p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <input
            autoFocus
            type="search"
            aria-label="Search events"
            placeholder="Search by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          {events === null ? (
            <p className="py-6 text-center text-sm text-gray-500">Loading...</p>
          ) : events.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No events to link.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {events.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">{format(event.startDate, event.isAllDay ? 'MMM d, yyyy' : 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <button
                    type="button"
                    disabled={linkingId !== null}
                    aria-label={`Link ${event.title}`}
                    onClick={() => void link(event)}
                    className="inline-flex shrink-0 items-center rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    Link
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
