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

export type CalendarComposerAttendee = { handle: string; displayName?: string; contactId?: string };

export type CalendarComposerContext = {
  targets: { type: CalendarTargetType; id: string }[];
  defaultAttendee?: CalendarComposerAttendee;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const useCalendarEventComposer = ({
  context,
  onCreated
}: {
  context: CalendarComposerContext;
  onCreated: () => void;
}) => {
  const [timeZone, setTimeZone] = useState(browserTimeZone);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [conferenceLink, setConferenceLink] = useState('');
  const [isFullDay, setIsFullDay] = useState(false);
  const [guestsText, setGuestsText] = useState(context.defaultAttendee?.handle ?? '');
  const [visibility, setVisibility] = useState<CalendarChannelVisibility>(CalendarChannelVisibility.SHARE_EVERYTHING);
  const [dates, setDates] = useState(() =>
    getCalendarEventComposerDefaultDates({ now: Temporal.Now.instant(), timeZone: browserTimeZone() })
  );
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default visibility comes from the user's calendar settings
  useEffect(() => {
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

  const hasValidDateRange = isFullDay ? dates.endsAt > dates.startsAt : Date.parse(dates.endsAt) > Date.parse(dates.startsAt);
  const canCreate = title.trim().length > 0 && hasValidDateRange && invalidGuests.length === 0 && !isCreating;

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
        attendees: guestHandles.map((handle) => ({
          handle,
          displayName: defaultAttendee && defaultAttendee.handle.toLowerCase() === handle ? defaultAttendee.displayName : undefined,
          contactId: defaultAttendee && defaultAttendee.handle.toLowerCase() === handle ? defaultAttendee.contactId : undefined
        })),
        targets: context.targets
      });
      onCreated();
    } catch (err) {
      console.error('Failed to create calendar event:', err);
      setError('Failed to create calendar event');
    } finally {
      setIsCreating(false);
    }
  }, [canCreate, context, title, description, location, dates, isFullDay, timeZone, visibility, conferenceLink, guestHandles, onCreated]);

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
    isCreating,
    error,
    handleCreate
  };
};
