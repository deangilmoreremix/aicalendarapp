/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/types/CalendarEvent.ts
 * Changes: import paths; call recordings field removed (external call-recorder providers are out of stack).
 */
import { type CalendarEventParticipant } from './CalendarEventParticipant';
import { type CalendarChannelVisibility } from './generated';

// TODO: use backend CalendarEvent type when ready
export type CalendarEvent = {
  conferenceLink?: {
    primaryLinkLabel: string;
    primaryLinkUrl: string;
  };
  description?: string;
  endsAt?: string;
  externalCreatedAt: string;
  id: string;
  isCanceled?: boolean;
  isFullDay: boolean;
  location?: string;
  startsAt: string;
  title?: string;
  visibility: CalendarChannelVisibility;
  calendarEventParticipants?: CalendarEventParticipant[];
  __typename: 'CalendarEvent';
};
