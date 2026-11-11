/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/record-drag/utils/getShiftedRecordCalendarDate.ts
 * Changes: import paths only.
 */
import { Temporal } from 'temporal-polyfill';

type GetShiftedRecordCalendarDateArgs = {
  dayOffset: number;
  startDate?: unknown;
};

export type ShiftedRecordCalendarDate = {
  startDate: string;
};

export const getShiftedRecordCalendarDate = ({
  dayOffset,
  startDate,
}: GetShiftedRecordCalendarDateArgs): ShiftedRecordCalendarDate | null => {
  if (typeof startDate !== 'string') {
    return null;
  }

  try {
    const currentStartDate = Temporal.PlainDate.from(startDate);
    const shiftedStartDate = currentStartDate.add({ days: dayOffset });

    return {
      startDate: shiftedStartDate.toString(),
    };
  } catch {
    return null;
  }
};
