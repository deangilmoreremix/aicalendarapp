/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/record-drag/utils/getShiftedRecordCalendarDateTimeUpdateInput.ts
 * Changes: import paths only.
 */
import { type ObjectRecord } from '../shared/ObjectRecord';
import { getShiftedRecordCalendarDateTime } from './getShiftedRecordCalendarDateTime';

type GetShiftedRecordCalendarDateTimeUpdateInputArgs = {
  record: ObjectRecord;
  calendarFieldName: string;
  dayOffset: number;
  timeZone: string;
  fallbackStartDateTime: string;
};

export const getShiftedRecordCalendarDateTimeUpdateInput = ({
  record,
  calendarFieldName,
  dayOffset,
  timeZone,
  fallbackStartDateTime,
}: GetShiftedRecordCalendarDateTimeUpdateInputArgs): Partial<ObjectRecord> => {
  const shiftedDateTime = getShiftedRecordCalendarDateTime({
    dayOffset,
    startDateTime: record[calendarFieldName],
    timeZone,
  });

  return {
    [calendarFieldName]:
      shiftedDateTime?.startDateTime ?? fallbackStartDateTime,
  };
};
