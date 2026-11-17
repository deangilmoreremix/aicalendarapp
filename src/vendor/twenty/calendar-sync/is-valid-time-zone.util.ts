/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-creation-manager/utils/is-valid-time-zone.util.ts
 * Changes: import paths. Logic unchanged.
 */
export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });

    return true;
  } catch {
    return false;
  }
};
