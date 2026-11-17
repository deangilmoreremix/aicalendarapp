/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/record-drag/utils/getShiftedRecordCalendarDateTime.ts
 * Changes: import paths only.
 */
import { Temporal } from 'temporal-polyfill';

type GetShiftedRecordCalendarDateTimeArgs = {
  dayOffset: number;
  startDateTime?: unknown;
  timeZone: string;
};

export type ShiftedRecordCalendarDateTime = {
  startDateTime: string;
};

export const getShiftedRecordCalendarDateTime = ({
  dayOffset,
  startDateTime,
  timeZone,
}: GetShiftedRecordCalendarDateTimeArgs): ShiftedRecordCalendarDateTime | null => {
  if (typeof startDateTime !== 'string') {
    return null;
  }

  try {
    const currentStartInstant = Temporal.Instant.from(startDateTime);
    const shiftedStartInstant = currentStartInstant
      .toZonedDateTimeISO(timeZone)
      .add({ days: dayOffset })
      .toInstant();

    return {
      startDateTime: shiftedStartInstant.toString(),
    };
  } catch {
    return null;
  }
};
