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