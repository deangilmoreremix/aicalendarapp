/**
 * Stand-ins for the GraphQL-generated types (`~/generated/graphql`) that the upstream Twenty
 * calendar code imports. Field names/shapes follow the upstream schema for the calendar timeline.
 * (Upstream: twentyhq/twenty @ f5cfa249c9fa, packages/twenty-front/src/generated/graphql.ts)
 */
export type Maybe<T> = T | null;
export { CalendarChannelVisibility } from '../shared/CalendarChannelVisibility';
import type { CalendarChannelVisibility } from '../shared/CalendarChannelVisibility';

export type TimelineCalendarEventParticipant = {
  avatarUrl: string;
  displayName: string;
  firstName: string;
  handle: string;
  lastName: string;
  personId?: string | null;
  workspaceMemberId?: string | null;
};

export type TimelineCalendarEvent = {
  conferenceLink?: { primaryLinkLabel: string; primaryLinkUrl: string } | null;
  conferenceSolution?: string;
  description?: string;
  endsAt?: string;
  id: string;
  isCanceled?: boolean;
  isFullDay: boolean;
  location?: string;
  participants?: TimelineCalendarEventParticipant[];
  startsAt: string;
  title?: string;
  visibility: CalendarChannelVisibility;
};

export type TimelineCalendarEventsWithTotal = {
  timelineCalendarEvents: TimelineCalendarEvent[];
  totalNumberOfCalendarEvents: number;
};
