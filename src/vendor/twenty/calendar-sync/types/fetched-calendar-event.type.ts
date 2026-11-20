/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/common/types/fetched-calendar-event.type.ts
 * Changes: import paths. Logic unchanged.
 */
export type FetchedCalendarEventParticipant = {
  displayName: string;
  responseStatus: string;
  handle: string;
  isOrganizer: boolean;
};

export type FetchedCalendarEvent = {
  id: string;
  title: string;
  iCalUid: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  isFullDay: boolean;
  isCanceled: boolean;
  isPrivate: boolean;
  conferenceLinkLabel: string;
  conferenceLinkUrl: string;
  externalCreatedAt: string;
  externalUpdatedAt: string;
  conferenceSolution: string;
  recurringEventExternalId?: string;
  organizerHandle: string;
  participants: FetchedCalendarEventParticipant[];
  status: string;
};
