import { format } from 'date-fns';
import { MapPin, Video, X } from 'lucide-react';

import { Dialog, DialogContent } from '../ui/dialog';
import { type TimelineCalendarEvent } from '../../vendor/twenty/calendar/types/generated';
import { getCalendarEventStartDate } from '../../vendor/twenty/calendar/utils/getCalendarEventStartDate';
import { getCalendarEventEndDate } from '../../vendor/twenty/calendar/utils/getCalendarEventEndDate';
import { getTimelineCalendarEventLabel } from '../../vendor/twenty/calendar/utils/getTimelineCalendarEventLabel';

export const CalendarEventDetailsModal = ({ event, onClose }: { event: TimelineCalendarEvent | null; onClose: () => void }) => {
  if (!event) return null;

  const startsAt = getCalendarEventStartDate(event);
  const endsAt = getCalendarEventEndDate(event);
  const when = event.isFullDay
    ? `${format(startsAt, 'PPP')} (all day)`
    : `${format(startsAt, 'PPP p')} - ${format(endsAt, 'p')}`;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <div className="space-y-3 p-6 text-left">
          <div className="flex items-start justify-between gap-4">
            <h2 className={`text-lg font-semibold text-gray-900 ${event.isCanceled ? 'line-through' : ''}`}>
              {getTimelineCalendarEventLabel(event)}
            </h2>
            <button type="button" aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">{when}</p>
          {event.location && (
            <p className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4" /> {event.location}
            </p>
          )}
          {event.conferenceLink && (
            <a
              href={event.conferenceLink.primaryLinkUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Video className="h-4 w-4" /> {event.conferenceLink.primaryLinkLabel}
            </a>
          )}
          {event.description && <p className="whitespace-pre-line text-sm text-gray-700">{event.description}</p>}
          {!!event.participants?.length && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Guests</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {event.participants.map((p) => (
                  <li key={p.handle}>
                    {p.displayName || p.handle} <span className="text-gray-400">{p.handle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
