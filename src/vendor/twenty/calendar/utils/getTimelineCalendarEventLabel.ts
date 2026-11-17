/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/utils/getTimelineCalendarEventLabel.ts
 * Changes: import paths; Lingui t`Calendar event` -> 'Calendar event'.
 */
import { isNonEmptyString } from '@sniptt/guards';
import {
  CalendarChannelVisibility,
  type TimelineCalendarEvent,
} from '../types/generated';

export const getTimelineCalendarEventLabel = (
  calendarEvent: Pick<TimelineCalendarEvent, 'title' | 'visibility'>,
) =>
  calendarEvent.visibility === CalendarChannelVisibility.SHARE_EVERYTHING &&
  isNonEmptyString(calendarEvent.title)
    ? calendarEvent.title
    : 'Calendar event';
