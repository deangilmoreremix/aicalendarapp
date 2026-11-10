/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/types/guards/IsTimelineCalendarEventParticipant.ts
 * Changes: import paths only.
 */
import { type CalendarEventParticipant } from '../CalendarEventParticipant';
import { type TimelineCalendarEventParticipant } from '../generated';

export const isTimelineCalendarEventParticipant = (
  participant: CalendarEventParticipant | TimelineCalendarEventParticipant,
): participant is TimelineCalendarEventParticipant => {
  return 'avatarUrl' in participant;
};
