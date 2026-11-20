/**
 * Adapted from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/hooks/useCalendarEventComposer.ts
 *
 * The upstream hook is built around connected email accounts (OAuth scopes, provider invitations,
 * GraphQL mutations, jotai state). None of that exists in this stack, so only the composer's own state
 * and date rules are kept; they run on the verbatim upstream date utilities. Events are saved with
 * calendarEventApi (Supabase). No invitation emails are sent.
 */
import { useCallback, useEffect, useState } from 'react';
import { Temporal } from 'temporal-polyfill';

import { getCalendarEventComposerDefaultDates } from '../../vendor/twenty/calendar/utils/getCalendarEventComposerDefaultDates';
import { getCalendarEventDatesAfterModeChange } from '../../vendor/twenty/calendar/utils/getCalendarEventDatesAfterModeChange';
import { getCalendarEventDatesAfterStartChange } from '../../vendor/twenty/calendar/utils/getCalendarEventDatesAfterStartChange';
import { CalendarChannelVisibility } from '../../vendor/twenty/calendar/shared/CalendarChannelVisibility';
import { calendarEventApi, type CalendarTargetType } from '../../services/api';
import type { CalendarEvent } from '../../types';
import { formatRule, parseRule, MAX_INTERVAL, MAX_OCCURRENCES, type RecurrenceFrequency, type RecurrenceRule } from '../../lib/calendar/recurrence';
import { getValidTimeZoneOrUndefined } from '../../vendor/twenty/calendar-sync/getValidTimeZoneOrUndefined';

export type CalendarComposerAttendee = { handle: string; displayName?: string; contactId?: string };

export type CalendarComposerContext = {
  targets: { type: CalendarTargetType; id: string }[];
  defaultAttendee?: CalendarComposerAttendee;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// All-day values are plain dates (YYYY-MM-DD); timed values are ISO instants
const localDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const toStoredDate = (value: string, isFullDay: boolean) =>
  isFullDay ? new Date(`${value}T00:00:00`) : new Date(value);

/** Editing one occurrence of a repeating event edits the series: start from the series' own first dates. */
const seriesBase = (event: CalendarEvent | undefined): CalendarEvent | undefined =>
  event?.seriesId
    ? { ...event, id: event.seriesId, startDate: event.seriesStartDate ?? event.startDate, endDate: event.seriesEndDate ?? event.endDate }
    : event;

export type RepeatEnds = 'never' | 'until' | 'count';

export const useCalendarEventComposer = ({
  context,
  onCreated,
  editing: editingProp,
  initialDate
}: {
  context: CalendarComposerContext;
  /** Called after a save; an edit passes the saved fields so callers can patch their copy. */
  onCreated: (saved?: Partial<CalendarEvent>) => void;
  /** When set, the composer edits this event instead of creating a new one. */
  editing?: CalendarEvent;
  /** New events start at 9:00 on this day (e.g. the empty day that was clicked on the calendar). */
  initialDate?: Date;
}) => {
  const editing = seriesBase(editingProp);
  const existingRule = parseRule(editing?.recurrenceRule);
  const [timeZone, setTimeZone] = useState(() => getValidTimeZoneOrUndefined(editing?.timeZone) ?? browserTimeZone());
  const [repeatFreq, setRepeatFreq] = useState<RecurrenceFrequency | ''>(existingRule?.freq ?? '');
  const [repeatInterval, setRepeatInterval] = useState(existingRule?.interval ?? 1);
  const [repeatDays, setRepeatDays] = useState<number[]>(existingRule?.byDay ?? []);
  const [repeatEnds, setRepeatEnds] = useState<RepeatEnds>(existingRule?.until ? 'until' : existingRule?.count !== undefined ? 'count' : 'never');
  const [repeatUntil, setRepeatUntil] = useState(existingRule?.until ? localDateString(existingRule.until) : '');
  const [repeatCount, setRepeatCount] = useState(existingRule?.count ?? 10);
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [conferenceLink, setConferenceLink] = useState(editing?.conferenceLink ?? '');
  const [isFullDay, setIsFullDay] = useState(editing?.isAllDay ?? false);
  const [guestsText, setGuestsText] = useState(context.defaultAttendee?.handle ?? '');
  const [visibility, setVisibility] = useState<CalendarChannelVisibility>(
    (editing?.visibility as CalendarChannelVisibility | undefined) ?? CalendarChannelVisibility.SHARE_EVERYTHING
  );
  const [dates, setDates] = useState(() =>
    editing
      ? editing.isAllDay
        ? { startsAt: localDateString(editing.startDate), endsAt: localDateString(editing.endDate) }
        : { startsAt: editing.startDate.toISOString(), endsAt: editing.endDate.toISOString() }
      : getCalendarEventComposerDefaultDates({
          // 8:45 so the upstream 30-minute rounding lands on 9:00
          now: initialDate
            ? Temporal.Instant.fromEpochMilliseconds(new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate(), 8, 45).getTime())
            : Temporal.Now.instant(),
          timeZone: browserTimeZone()
        })
  );
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default visibility comes from the user's calendar settings (only for new events; an edited event keeps its own)
  useEffect(() => {
    if (editing) return;
    calendarEventApi
      .getSettings()
      .then(({ defaultVisibility }) => setVisibility(defaultVisibility))
      .catch(() => undefined);
  }, []);

  const guestHandles = guestsText
    .split(/[,;\s]+/)
    .map((handle) => handle.trim().toLowerCase())
    .filter(Boolean);
  const invalidGuests = guestHandles.filter((handle) => !EMAIL_PATTERN.test(handle));

  const repeatInvalid =
    repeatFreq !== '' &&
    (!Number.isInteger(repeatInterval) || repeatInterval < 1 || repeatInterval > MAX_INTERVAL ||
      (repeatEnds === 'count' && (!Number.isInteger(repeatCount) || repeatCount < 1 || repeatCount > MAX_OCCURRENCES)) ||
      (repeatEnds === 'until' && (!repeatUntil || repeatUntil < localDateString(toStoredDate(dates.startsAt, isFullDay)))));

  /** The RRULE text for the chosen repeat settings, or undefined for an event that does not repeat. */
  const buildRecurrenceRule = (): string | undefined => {
    if (repeatFreq === '') return undefined;
    const rule: RecurrenceRule = { freq: repeatFreq, interval: repeatInterval };
    if (repeatFreq === 'WEEKLY' && repeatDays.length > 0) rule.byDay = [...repeatDays].sort((a, b) => a - b);
    if (repeatEnds === 'count') rule.count = repeatCount;
    if (repeatEnds === 'until') {
      // an end date the person did not change keeps the exact instant it was saved (or imported) with
      rule.until = existingRule?.until && repeatUntil === localDateString(existingRule.until) ? existingRule.until : new Date(`${repeatUntil}T23:59:59`);
    }
    return formatRule(rule);
  };

  const hasValidDateRange = isFullDay ? dates.endsAt > dates.startsAt : Date.parse(dates.endsAt) > Date.parse(dates.startsAt);
  const canCreate = title.trim().length > 0 && hasValidDateRange && !repeatInvalid && (editing ? true : invalidGuests.length === 0) && !isCreating;

  const handleStartChange = (startsAt: string) =>
    setDates((current) => getCalendarEventDatesAfterStartChange({ dates: current, startsAt, isFullDay }));

  const handleEndChange = (endsAt: string) => setDates((current) => ({ ...current, endsAt }));

  const handleFullDayChange = (nextIsFullDay: boolean) => {
    setDates((current) => getCalendarEventDatesAfterModeChange({ dates: current, isFullDay: nextIsFullDay, timeZone }));
    setIsFullDay(nextIsFullDay);
  };

  const handleTimeZoneChange = (nextTimeZone: string) => {
    // Keep the same instants; only the wall-clock rendering changes.
    setTimeZone(nextTimeZone);
  };

  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    setIsCreating(true);
    setError(null);
    try {
      if (editing) {
        // Guests and record links are left as they are; only the event's own fields change
        const saved = {
          title: title.trim(),
          description,
          location,
          startDate: toStoredDate(dates.startsAt, isFullDay),
          endDate: toStoredDate(dates.endsAt, isFullDay),
          isAllDay: isFullDay,
          timeZone,
          visibility,
          conferenceLink,
          recurrenceRule: buildRecurrenceRule() ?? null
        };
        await calendarEventApi.update(editing.id, saved);
        onCreated({ ...saved, recurrenceRule: saved.recurrenceRule ?? undefined } as Partial<CalendarEvent>);
        return;
      }
      const defaultAttendee = context.defaultAttendee;
      await calendarEventApi.create({
        title: title.trim(),
        description,
        location,
        startsAt: dates.startsAt,
        endsAt: dates.endsAt,
        isFullDay,
        timeZone,
        visibility,
        conferenceLink,
        recurrenceRule: buildRecurrenceRule(),
        attendees: guestHandles.map((handle) => ({
          handle,
          displayName: defaultAttendee && defaultAttendee.handle.toLowerCase() === handle ? defaultAttendee.displayName : undefined,
          contactId: defaultAttendee && defaultAttendee.handle.toLowerCase() === handle ? defaultAttendee.contactId : undefined
        })),
        targets: context.targets
      });
      onCreated();
    } catch (err) {
      console.error('Failed to save calendar event:', err);
      setError(editing ? 'Failed to save changes' : 'Failed to create calendar event');
    } finally {
      setIsCreating(false);
    }
  }, [canCreate, editing, context, title, description, location, dates, isFullDay, timeZone, visibility, conferenceLink, guestHandles, onCreated, repeatFreq, repeatInterval, repeatDays, repeatEnds, repeatUntil, repeatCount]);

  return {
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    conferenceLink,
    setConferenceLink,
    guestsText,
    setGuestsText,
    invalidGuests,
    visibility,
    setVisibility,
    timeZone,
    handleTimeZoneChange,
    isFullDay,
    handleFullDayChange,
    dates,
    handleStartChange,
    handleEndChange,
    hasValidDateRange,
    canCreate,
    repeatFreq,
    setRepeatFreq,
    repeatInterval,
    setRepeatInterval,
    repeatDays,
    setRepeatDays,
    repeatEnds,
    setRepeatEnds,
    repeatUntil,
    setRepeatUntil,
    repeatCount,
    setRepeatCount,
    repeatInvalid,
    isEditing: !!editing,
    isCreating,
    error,
    handleCreate
  };
};
