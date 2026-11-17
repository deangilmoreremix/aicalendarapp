/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/record-drag/utils/__tests__/getShiftedRecordCalendarDateTime.test.ts
 * Changes: import paths only.
 */
import { getShiftedRecordCalendarDateTime } from '../getShiftedRecordCalendarDateTime';

const timeZone = 'Europe/Paris';

describe('getShiftedRecordCalendarDateTime', () => {
  it('moves a date-time by the day offset without changing the time', () => {
    expect(
      getShiftedRecordCalendarDateTime({
        dayOffset: 3,
        startDateTime: '2026-07-08T15:59:00Z',
        timeZone,
      }),
    ).toEqual({
      startDateTime: '2026-07-11T15:59:00Z',
    });
  });

  it('preserves the local time across DST', () => {
    expect(
      getShiftedRecordCalendarDateTime({
        dayOffset: 1,
        startDateTime: '2026-03-28T09:00:00Z',
        timeZone,
      }),
    ).toEqual({
      startDateTime: '2026-03-29T08:00:00Z',
    });
  });

  it('preserves the later offset when the source start is a repeated DST time', () => {
    expect(
      getShiftedRecordCalendarDateTime({
        dayOffset: 1,
        startDateTime: '2026-10-25T01:30:00Z',
        timeZone,
      }),
    ).toEqual({
      startDateTime: '2026-10-26T01:30:00Z',
    });
  });

  it('returns null for an unusable start', () => {
    expect(
      getShiftedRecordCalendarDateTime({
        dayOffset: 1,
        startDateTime: undefined,
        timeZone,
      }),
    ).toBeNull();
  });
});
