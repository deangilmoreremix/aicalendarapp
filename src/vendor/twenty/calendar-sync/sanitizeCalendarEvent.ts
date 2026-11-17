/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-import-manager/drivers/utils/sanitizeCalendarEvent.ts
 * Changes: import paths; dropped the oxlint pragma comment. Logic unchanged.
 */
import { isDefined } from './isDefined';

export const sanitizeCalendarEvent = <T extends Record<string, any>>(
  event: T,
  propertiesToSanitize: (keyof T)[],
): T => {
  const sanitizedEvent = { ...event };

  for (const property of propertiesToSanitize) {
    if (!isDefined(sanitizedEvent[property])) {
      continue;
    }
    if (typeof sanitizedEvent[property] !== 'string') {
      continue;
    }
    sanitizedEvent[property] = sanitizeString(
      sanitizedEvent[property],
    ) as T[typeof property];
  }

  return sanitizedEvent;
};

const sanitizeString = (value: string): string => {
  return value.replace('\u0000', '').replace('\x00', '').replace('\x7f', '');
};
