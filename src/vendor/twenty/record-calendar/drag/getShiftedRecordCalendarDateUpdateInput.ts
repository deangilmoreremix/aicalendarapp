/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/record-drag/utils/getShiftedRecordCalendarDateUpdateInput.ts
 * Changes: import paths only.
 */
import { type ObjectRecord } from '../shared/ObjectRecord';
import { getShiftedRecordCalendarDate } from './getShiftedRecordCalendarDate';

type GetShiftedRecordCalendarDateUpdateInputArgs = {
  record: ObjectRecord;
  calendarFieldName: string;
  dayOffset: number;
  fallbackStartDate: string;
};

export const getShiftedRecordCalendarDateUpdateInput = ({
  record,
  calendarFieldName,
  dayOffset,
  fallbackStartDate,
}: GetShiftedRecordCalendarDateUpdateInputArgs): Partial<ObjectRecord> => {
  const shiftedDate = getShiftedRecordCalendarDate({
    dayOffset,
    startDate: record[calendarFieldName],
  });

  return {
    [calendarFieldName]: shiftedDate?.startDate ?? fallbackStartDate,
  };
};
