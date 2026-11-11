/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-shared/src/utils/date/turnPlainDateToShiftedDateInSystemTimeZone.ts
 * Changes: import paths only.
 */
import { type Temporal } from 'temporal-polyfill';

export const turnPlainDateToShiftedDateInSystemTimeZone = (
  plainDate: Temporal.PlainDate,
) => {
  const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateShiftedToISOString = plainDate
    .toZonedDateTime(systemTimeZone)
    .toInstant()
    .toString();

  const dateForDatePicker = new Date(dateShiftedToISOString);

  return dateForDatePicker;
};
