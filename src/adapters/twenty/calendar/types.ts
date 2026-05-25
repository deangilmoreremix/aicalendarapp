/**
 * Rich calendar event model inspired by Twenty CRM.
 *
 * These types are used as a source of truth for data enrichment.
 * They are merged into the AI Calendar's own types (see src/types/index.ts)
 * and used via pure transformers. No Twenty visual components are rendered.
 */
export type TimelineCalendarEventParticipant = {
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  handle?: string;
  personId?: string;
  workspaceMemberId?: string;
};

export type TimelineCalendarEvent = {
  id: string;
  title: string;
  isCanceled?: boolean;
  isFullDay?: boolean;
  startsAt: string;
  endsAt?: string;
  description?: string;
  location?: string;
  conferenceSolution?: string;
  conferenceLink?: string;
  participants?: TimelineCalendarEventParticipant[];
  visibility?: 'SHARE_EVERYTHING' | 'METADATA';
};