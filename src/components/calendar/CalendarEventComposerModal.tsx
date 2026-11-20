/**
 * Adapted from twentyhq/twenty CalendarEventComposerFields (AGPL-3.0, used with permission).
 * Same fields as upstream (calendar-less variant): guests, title, all-day, start/end, time zone,
 * location, description, visibility. Styling uses this app's design.
 */
import { Temporal } from 'temporal-polyfill';
import { X } from 'lucide-react';

import { Dialog, DialogContent } from '../ui/dialog';
import { useCalendarEventComposer, type CalendarComposerContext, type RepeatEnds } from './useCalendarEventComposer';
import type { RecurrenceFrequency } from '../../lib/calendar/recurrence';
import type { CalendarEvent } from '../../types';
import { CalendarChannelVisibility } from '../../vendor/twenty/calendar/shared/CalendarChannelVisibility';

export type { CalendarComposerContext } from './useCalendarEventComposer';

type CalendarEventComposerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (saved?: Partial<CalendarEvent>) => void;
  context: CalendarComposerContext;
  /** Edit this event instead of creating a new one. */
  editing?: CalendarEvent;
  initialDate?: Date;
};

const WEEKDAYS: [string, number][] = [['Mon', 1], ['Tue', 2], ['Wed', 3], ['Thu', 4], ['Fri', 5], ['Sat', 6], ['Sun', 0]];

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

const TIME_ZONES: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone');
  } catch {
    return ['UTC'];
  }
})();

// Instant <-> wall-clock value for <input type="datetime-local"> in the event's time zone
const instantToLocalInput = (instant: string, timeZone: string) =>
  Temporal.Instant.from(instant).toZonedDateTimeISO(timeZone).toPlainDateTime().toString().slice(0, 16);
const localInputToInstant = (value: string, timeZone: string) =>
  Temporal.PlainDateTime.from(value).toZonedDateTime(timeZone).toInstant().toString();

export const CalendarEventComposerModal = ({ isOpen, onClose, onCreated, context, editing, initialDate }: CalendarEventComposerModalProps) => {
  const composer = useCalendarEventComposer({
    context,
    editing,
    initialDate,
    onCreated: (saved) => {
      onCreated(saved);
      onClose();
    }
  });

  if (!isOpen) return null;

  const timeZones = TIME_ZONES.includes(composer.timeZone) ? TIME_ZONES : [composer.timeZone, ...TIME_ZONES];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <form
          className="space-y-4 p-6 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            void composer.handleCreate();
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{composer.isEditing ? 'Edit event' : 'New event'}</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!composer.isEditing && (
          <label className="block text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Guests</span>
            <input
              className={inputClass}
              value={composer.guestsText}
              onChange={(e) => composer.setGuestsText(e.target.value)}
              placeholder="name@example.com, other@example.com"
            />
            {composer.invalidGuests.length > 0 && (
              <span className="mt-1 block text-xs text-red-600">Invalid email: {composer.invalidGuests.join(', ')}</span>
            )}
          </label>
          )}

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Title</span>
            <input className={inputClass} value={composer.title} onChange={(e) => composer.setTitle(e.target.value)} autoFocus />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={composer.isFullDay}
              onChange={(e) => composer.handleFullDayChange(e.target.checked)}
            />
            All day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700 dark:text-gray-300">Starts</span>
              {composer.isFullDay ? (
                <input
                  type="date"
                  className={inputClass}
                  value={composer.dates.startsAt}
                  onChange={(e) => e.target.value && composer.handleStartChange(e.target.value)}
                />
              ) : (
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={instantToLocalInput(composer.dates.startsAt, composer.timeZone)}
                  onChange={(e) => e.target.value && composer.handleStartChange(localInputToInstant(e.target.value, composer.timeZone))}
                />
              )}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-700 dark:text-gray-300">Ends</span>
              {composer.isFullDay ? (
                <input
                  type="date"
                  className={inputClass}
                  value={composer.dates.endsAt}
                  onChange={(e) => e.target.value && composer.handleEndChange(e.target.value)}
                />
              ) : (
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={instantToLocalInput(composer.dates.endsAt, composer.timeZone)}
                  onChange={(e) => e.target.value && composer.handleEndChange(localInputToInstant(e.target.value, composer.timeZone))}
                />
              )}
            </label>
          </div>
          {!composer.hasValidDateRange && <p className="text-xs text-red-600">The end must be after the start.</p>}

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Time zone</span>
            <select aria-label="Time zone" className={inputClass} value={composer.timeZone} onChange={(e) => composer.handleTimeZoneChange(e.target.value)}>
              {timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-2 text-sm">
            <legend className="mb-1 text-gray-700 dark:text-gray-300">Repeat</legend>
            <select
              aria-label="Repeat"
              className={inputClass}
              value={composer.repeatFreq}
              onChange={(e) => composer.setRepeatFreq(e.target.value as RecurrenceFrequency | '')}
            >
              <option value="">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            {composer.repeatFreq !== '' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 dark:text-gray-300">Every</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    aria-label="Repeat interval"
                    className={`${inputClass} !w-20`}
                    value={composer.repeatInterval}
                    onChange={(e) => composer.setRepeatInterval(Number(e.target.value))}
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {{ DAILY: 'day(s)', WEEKLY: 'week(s)', MONTHLY: 'month(s)', YEARLY: 'year(s)' }[composer.repeatFreq]}
                  </span>
                </div>
                {composer.repeatFreq === 'WEEKLY' && (
                  <div className="flex flex-wrap gap-1" role="group" aria-label="Repeat on">
                    {WEEKDAYS.map(([label, day]) => {
                      const on = composer.repeatDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={on}
                          onClick={() => composer.setRepeatDays(on ? composer.repeatDays.filter((d) => d !== day) : [...composer.repeatDays, day])}
                          className={`rounded-md border px-2 py-1 text-xs ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <select aria-label="Repeat ends" className={`${inputClass} !w-40`} value={composer.repeatEnds} onChange={(e) => composer.setRepeatEnds(e.target.value as RepeatEnds)}>
                    <option value="never">Never ends</option>
                    <option value="until">Ends on</option>
                    <option value="count">Ends after</option>
                  </select>
                  {composer.repeatEnds === 'until' && (
                    <input type="date" aria-label="Repeat until" className={`${inputClass} !w-44`} value={composer.repeatUntil} onChange={(e) => composer.setRepeatUntil(e.target.value)} />
                  )}
                  {composer.repeatEnds === 'count' && (
                    <>
                      <input type="number" min={1} max={1000} aria-label="Repeat count" className={`${inputClass} !w-24`} value={composer.repeatCount} onChange={(e) => composer.setRepeatCount(Number(e.target.value))} />
                      <span className="text-gray-700 dark:text-gray-300">times</span>
                    </>
                  )}
                </div>
                {composer.repeatInvalid && <p className="text-xs text-red-600">Check the repeat settings (every 1-99, end date not before the start, up to 1000 times).</p>}
                {composer.isEditing && <p className="text-xs text-gray-500">Changes apply to the whole series.</p>}
              </>
            )}
          </fieldset>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Location</span>
            <input className={inputClass} value={composer.location} onChange={(e) => composer.setLocation(e.target.value)} />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Video call link</span>
            <input
              type="url"
              className={inputClass}
              value={composer.conferenceLink}
              onChange={(e) => composer.setConferenceLink(e.target.value)}
              placeholder="https://"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Description</span>
            <textarea
              className={inputClass}
              rows={3}
              value={composer.description}
              onChange={(e) => composer.setDescription(e.target.value)}
            />
          </label>

          <fieldset className="text-sm">
            <legend className="mb-1 text-gray-700 dark:text-gray-300">Visibility</legend>
            <label className="mb-1 flex items-start gap-2">
              <input
                type="radio"
                name="event-visibility"
                checked={composer.visibility === CalendarChannelVisibility.SHARE_EVERYTHING}
                onChange={() => composer.setVisibility(CalendarChannelVisibility.SHARE_EVERYTHING)}
              />
              <span>
                <span className="font-medium">Everything</span>
                <span className="block text-xs text-gray-500">The whole event details will be shared with your team.</span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="event-visibility"
                checked={composer.visibility === CalendarChannelVisibility.METADATA}
                onChange={() => composer.setVisibility(CalendarChannelVisibility.METADATA)}
              />
              <span>
                <span className="font-medium">Metadata</span>
                <span className="block text-xs text-gray-500">Only date & participants will be shared with your team.</span>
              </span>
            </label>
          </fieldset>

          {composer.error && <p className="text-sm text-red-600">{composer.error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!composer.canCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {composer.isCreating ? (composer.isEditing ? 'Saving...' : 'Creating...') : composer.isEditing ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
