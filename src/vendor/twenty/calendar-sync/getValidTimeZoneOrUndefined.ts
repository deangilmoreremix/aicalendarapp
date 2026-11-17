/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-shared/src/utils/date/getValidTimeZoneOrUndefined.ts
 * Changes: import paths. Logic unchanged.
 */
import { isNonEmptyString } from '@sniptt/guards';

export const getValidTimeZoneOrUndefined = (
  timeZone: string | null | undefined,
): string | undefined => {
  if (!isNonEmptyString(timeZone) || timeZone === 'system') {
    return undefined;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone });

    return timeZone;
  } catch {
    return undefined;
  }
};
