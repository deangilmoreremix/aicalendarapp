/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/record-drag/utils/__tests__/getShiftedRecordCalendarDateUpdateInput.test.ts
 * Changes: import paths only.
 */
import { type ObjectRecord } from '../../shared/ObjectRecord';
import { getShiftedRecordCalendarDateUpdateInput } from '../getShiftedRecordCalendarDateUpdateInput';

const buildRecord = (fields: Record<string, unknown>): ObjectRecord =>
  ({
    id: 'record-id',
    __typename: 'Record',
    ...fields,
  }) as ObjectRecord;

describe('getShiftedRecordCalendarDateUpdateInput', () => {
  it('shifts the start date by the day offset', () => {
    expect(
      getShiftedRecordCalendarDateUpdateInput({
        record: buildRecord({ startDate: '2026-07-08' }),
        calendarFieldName: 'startDate',
        dayOffset: 3,
        fallbackStartDate: '2026-07-20',
      }),
    ).toEqual({ startDate: '2026-07-11' });
  });

  it('updates only the selected date field, leaving other dates untouched', () => {
    expect(
      getShiftedRecordCalendarDateUpdateInput({
        record: buildRecord({ startDate: '2026-07-08', endDate: '2026-07-10' }),
        calendarFieldName: 'startDate',
        dayOffset: 1,
        fallbackStartDate: '2026-07-20',
      }),
    ).toEqual({ startDate: '2026-07-09' });
  });

  it('falls back to the destination date when the start is missing', () => {
    expect(
      getShiftedRecordCalendarDateUpdateInput({
        record: buildRecord({}),
        calendarFieldName: 'startDate',
        dayOffset: 1,
        fallbackStartDate: '2026-07-20',
      }),
    ).toEqual({ startDate: '2026-07-20' });
  });

  it('falls back without an end when the stored start is malformed', () => {
    expect(
      getShiftedRecordCalendarDateUpdateInput({
        record: buildRecord({ startDate: 'not-a-date', endDate: '2026-07-10' }),
        calendarFieldName: 'startDate',
        dayOffset: 1,
        fallbackStartDate: '2026-07-20',
      }),
    ).toEqual({ startDate: '2026-07-20' });
  });
});
