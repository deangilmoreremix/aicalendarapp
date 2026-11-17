/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/record-calendar/utils/formatRecordCalendarWeekRange.ts
 * Changes: import paths only.
 */
import { format, type Locale } from 'date-fns';
import { type Temporal } from 'temporal-polyfill';
import { turnPlainDateToShiftedDateInSystemTimeZone } from '../shared/turnPlainDateToShiftedDateInSystemTimeZone';
import { doNotTranslate } from '../shared/doNotTranslate';

type FormatRecordCalendarWeekRangeArgs = {
  firstDayOfWeek: Temporal.PlainDate;
  lastDayOfWeek: Temporal.PlainDate;
  locale: Locale;
};

export const formatRecordCalendarWeekRange = ({
  firstDayOfWeek,
  lastDayOfWeek,
  locale,
}: FormatRecordCalendarWeekRangeArgs) => {
  const firstDay = turnPlainDateToShiftedDateInSystemTimeZone(firstDayOfWeek);
  const lastDay = turnPlainDateToShiftedDateInSystemTimeZone(lastDayOfWeek);
  const formatOptions = { locale };

  if (firstDayOfWeek.year !== lastDayOfWeek.year) {
    return `${format(firstDay, doNotTranslate('MMM d, yyyy'), formatOptions)} – ${format(
      lastDay,
      doNotTranslate('MMM d, yyyy'),
      formatOptions,
    )}`;
  }

  if (firstDayOfWeek.month !== lastDayOfWeek.month) {
    return `${format(firstDay, 'MMM d', formatOptions)} – ${format(
      lastDay,
      doNotTranslate('MMM d, yyyy'),
      formatOptions,
    )}`;
  }

  return `${format(firstDay, 'MMM d', formatOptions)} – ${format(
    lastDay,
    doNotTranslate('d, yyyy'),
    formatOptions,
  )}`;
};
