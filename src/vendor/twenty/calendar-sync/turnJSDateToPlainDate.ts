/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-shared/src/utils/date/turnJSDateToPlainDate.ts
 * Changes: import paths. Logic unchanged.
 */
import { Temporal } from 'temporal-polyfill';

export const turnJSDateToPlainDate = (date: Date) => {
  const plainDate = Temporal.PlainDate.from({
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  });

  return plainDate;
};
