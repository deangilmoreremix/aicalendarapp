import { CalendarEvent, CalendarEventParticipant } from '../../types';
import { TimelineCalendarEvent, TimelineCalendarEventParticipant } from './types';

export const toTimelineCalendarEvent = (
  event: CalendarEvent
): TimelineCalendarEvent => {
  return {
    id: event.id,
    title: event.title,
    isFullDay: event.isAllDay,
    startsAt: event.startDate.toISOString(),
    endsAt: event.endDate?.toISOString(),
    description: event.description,
    location: event.location,
    conferenceSolution: event.conferenceSolution,
    conferenceLink: event.conferenceLink,
    participants: event.participants?.map((p) => ({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      displayName: p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
      avatarUrl: p.avatarUrl,
      handle: p.handle,
      personId: p.personId,
      workspaceMemberId: p.workspaceMemberId,
    })) || [],
    visibility: event.visibility,
  };
};

export const toTimelineParticipant = (
  attendee: string | CalendarEventParticipant
): TimelineCalendarEventParticipant => {
  if (typeof attendee === 'string') {
    return {
      displayName: attendee,
      firstName: '',
      lastName: '',
    };
  }
  return {
    firstName: attendee.firstName || '',
    lastName: attendee.lastName || '',
    displayName: attendee.displayName || `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim(),
    avatarUrl: attendee.avatarUrl,
    handle: attendee.handle,
    personId: attendee.personId,
    workspaceMemberId: attendee.workspaceMemberId,
  };
};

export const getConferenceProviderIcon = (provider?: string): string => {
  switch (provider?.toLowerCase()) {
    case 'zoom':
      return '📺';
    case 'google meet':
    case 'meet':
      return '🗺️';
    case 'microsoft teams':
    case 'teams':
      return '💻';
    default:
      return '🔗';
  }
};

export const getVisibilityLabel = (visibility?: string): string => {
  switch (visibility) {
    case 'SHARE_EVERYTHING':
      return 'Shared';
    case 'METADATA':
      return 'Private';
    default:
      return 'Normal';
  }
};