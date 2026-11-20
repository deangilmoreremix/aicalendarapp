/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-import-manager/utils/has-calendar-event-changed.util.ts
 * Changes: import paths; `ComparableCalendarEvent` is spelled out (upstream picks these fields from its workspace entity
 * class, which is not part of this app). Logic unchanged.
 */
import { isNonEmptyString } from '@sniptt/guards';
import { isNonEmptyArray } from './isNonEmptyArray';
import { parseToInstantOrThrow } from './parseToInstantOrThrow';

export type ComparableCalendarEvent = {
  id: string;
  iCalUid: string | null;
  title: string | null;
  description: string | null;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
  location: string | null;
  isFullDay: boolean;
  isCanceled: boolean;
  conferenceSolution: string | null;
  conferenceLink: {
    primaryLinkLabel?: string | null;
    primaryLinkUrl?: string | null;
    secondaryLinks?: unknown[] | null;
  };
};

const TEXT_FIELD_NAMES = [
  'iCalUid',
  'title',
  'description',
  'location',
  'conferenceSolution',
] as const;

const DATE_TIME_FIELD_NAMES = ['startsAt', 'endsAt'] as const;

const BOOLEAN_FIELD_NAMES = ['isFullDay', 'isCanceled'] as const;

const toEpochMilliseconds = (value: string | Date | null): number | null => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (!isNonEmptyString(value)) {
    return null;
  }

  try {
    return parseToInstantOrThrow(value).epochMilliseconds;
  } catch {
    return Number.NaN;
  }
};

export const hasCalendarEventChanged = ({
  existingCalendarEvent,
  calendarEvent,
}: {
  existingCalendarEvent: ComparableCalendarEvent;
  calendarEvent: Omit<ComparableCalendarEvent, 'id'>;
}): boolean =>
  TEXT_FIELD_NAMES.some(
    (fieldName) =>
      (existingCalendarEvent[fieldName] ?? '') !==
      (calendarEvent[fieldName] ?? ''),
  ) ||
  DATE_TIME_FIELD_NAMES.some(
    (fieldName) =>
      toEpochMilliseconds(existingCalendarEvent[fieldName]) !==
      toEpochMilliseconds(calendarEvent[fieldName]),
  ) ||
  BOOLEAN_FIELD_NAMES.some(
    (fieldName) =>
      existingCalendarEvent[fieldName] !== calendarEvent[fieldName],
  ) ||
  (existingCalendarEvent.conferenceLink?.primaryLinkLabel ?? '') !==
    (calendarEvent.conferenceLink.primaryLinkLabel ?? '') ||
  (existingCalendarEvent.conferenceLink?.primaryLinkUrl ?? '') !==
    (calendarEvent.conferenceLink.primaryLinkUrl ?? '') ||
  isNonEmptyArray(existingCalendarEvent.conferenceLink?.secondaryLinks);
