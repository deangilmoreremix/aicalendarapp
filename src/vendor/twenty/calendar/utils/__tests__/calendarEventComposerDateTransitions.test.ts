/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/utils/__tests__/calendarEventComposerDateTransitions.test.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import { getCalendarEventDatesAfterModeChange } from '../getCalendarEventDatesAfterModeChange';
import { getCalendarEventDatesAfterStartChange } from '../getCalendarEventDatesAfterStartChange';

describe('calendar event composer date transitions', () => {
  it('converts a timed event to a one-day all-day event in its timezone', () => {
    expect(
      getCalendarEventDatesAfterModeChange({
        dates: {
          startsAt: '2026-03-28T23:30:00Z',
          endsAt: '2026-03-29T00:30:00Z',
        },
        isFullDay: true,
        timeZone: 'Europe/Paris',
      }),
    ).toEqual({ startsAt: '2026-03-29', endsAt: '2026-03-30' });
  });

  it('converts an all-day event back to a local 9 AM one-hour event', () => {
    expect(
      getCalendarEventDatesAfterModeChange({
        dates: { startsAt: '2026-03-29', endsAt: '2026-03-30' },
        isFullDay: false,
        timeZone: 'Europe/Paris',
      }),
    ).toEqual({
      startsAt: '2026-03-29T07:00:00Z',
      endsAt: '2026-03-29T08:00:00Z',
    });
  });

  it('clamps an all-day end to one day after a later start', () => {
    expect(
      getCalendarEventDatesAfterStartChange({
        dates: { startsAt: '2026-08-23', endsAt: '2026-08-24' },
        startsAt: '2026-08-25',
        isFullDay: true,
      }),
    ).toEqual({ startsAt: '2026-08-25', endsAt: '2026-08-26' });
  });

  it('clamps a timed end to one hour after a later start', () => {
    expect(
      getCalendarEventDatesAfterStartChange({
        dates: {
          startsAt: '2026-08-23T09:00:00Z',
          endsAt: '2026-08-23T10:00:00Z',
        },
        startsAt: '2026-08-23T11:00:00Z',
        isFullDay: false,
      }),
    ).toEqual({
      startsAt: '2026-08-23T11:00:00Z',
      endsAt: '2026-08-23T12:00:00Z',
    });
  });
});
