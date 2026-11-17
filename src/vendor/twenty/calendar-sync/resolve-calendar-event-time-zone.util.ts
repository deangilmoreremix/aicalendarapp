/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-creation-manager/utils/resolve-calendar-event-time-zone.util.ts
 * Changes: import paths. Logic unchanged.
 */
import { isNonEmptyString } from '@sniptt/guards';

// The workflow node stores an empty string when no time zone is picked
export const resolveCalendarEventTimeZone = (timeZone?: string): string =>
  isNonEmptyString(timeZone) ? timeZone : 'UTC';
