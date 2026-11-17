/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-import-manager/drivers/caldav/utils/__tests__/is-event-in-time-range.util.spec.ts
 * Changes: import paths; tests: jest globals -> vitest imports. Logic unchanged.
 */
import { describe, it, expect } from 'vitest';
import { isEventInTimeRange } from '../is-event-in-time-range.util';

const event = ({ startsAt, endsAt }: { startsAt: string; endsAt: string }) => ({
  startsAt,
  endsAt,
});

const WINDOW_START = new Date('2026-01-01');
const WINDOW_END = new Date('2026-12-31');

describe('isEventInTimeRange', () => {
  it('returns false when the event lacks start or end', () => {
    expect(
      isEventInTimeRange(
        event({ startsAt: '', endsAt: '' }),
        WINDOW_START,
        WINDOW_END,
      ),
    ).toBe(false);
  });

  it('includes events fully inside the window', () => {
    expect(
      isEventInTimeRange(
        event({
          startsAt: '2026-06-01T10:00:00Z',
          endsAt: '2026-06-01T11:00:00Z',
        }),
        WINDOW_START,
        WINDOW_END,
      ),
    ).toBe(true);
  });

  it('excludes events entirely before the window', () => {
    expect(
      isEventInTimeRange(
        event({
          startsAt: '2025-06-01T10:00:00Z',
          endsAt: '2025-06-01T11:00:00Z',
        }),
        WINDOW_START,
        WINDOW_END,
      ),
    ).toBe(false);
  });

  it('excludes events entirely after the window', () => {
    expect(
      isEventInTimeRange(
        event({
          startsAt: '2027-06-01T10:00:00Z',
          endsAt: '2027-06-01T11:00:00Z',
        }),
        WINDOW_START,
        WINDOW_END,
      ),
    ).toBe(false);
  });

  it('includes events that straddle the start boundary', () => {
    expect(
      isEventInTimeRange(
        event({
          startsAt: '2025-12-31T22:00:00Z',
          endsAt: '2026-01-01T02:00:00Z',
        }),
        WINDOW_START,
        WINDOW_END,
      ),
    ).toBe(true);
  });

  it('includes events that straddle the end boundary', () => {
    expect(
      isEventInTimeRange(
        event({
          startsAt: '2026-12-30T22:00:00Z',
          endsAt: '2027-01-01T02:00:00Z',
        }),
        WINDOW_START,
        WINDOW_END,
      ),
    ).toBe(true);
  });
});
