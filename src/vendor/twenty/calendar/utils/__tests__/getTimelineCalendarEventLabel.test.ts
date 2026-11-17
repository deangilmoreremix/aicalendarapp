/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/utils/__tests__/getTimelineCalendarEventLabel.test.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import { getTimelineCalendarEventLabel } from '../getTimelineCalendarEventLabel';
import { CalendarChannelVisibility } from '../../types/generated';

describe('getTimelineCalendarEventLabel', () => {
  it('should return the title when everything is shared', () => {
    expect(
      getTimelineCalendarEventLabel({
        title: 'Renewal review',
        visibility: CalendarChannelVisibility.SHARE_EVERYTHING,
      }),
    ).toBe('Renewal review');
  });

  it('should hide the title when only metadata is shared', () => {
    expect(
      getTimelineCalendarEventLabel({
        title: 'Renewal review',
        visibility: CalendarChannelVisibility.METADATA,
      }),
    ).toBe('Calendar event');
  });
});
