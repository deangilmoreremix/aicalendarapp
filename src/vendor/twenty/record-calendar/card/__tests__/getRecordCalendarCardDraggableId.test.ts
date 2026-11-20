/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-front/src/modules/object-record/record-calendar/record-calendar-card/utils/__tests__/getRecordCalendarCardDraggableId.test.ts
 * Changes: import paths; tests: jest globals -> vitest imports. Logic unchanged.
 */
import { describe, it, expect } from 'vitest';
import { getRecordCalendarCardDraggableId } from '../getRecordCalendarCardDraggableId';

describe('getRecordCalendarCardDraggableId', () => {
  it('creates a different draggable id for each rendered day', () => {
    const firstDayDraggableId = getRecordCalendarCardDraggableId({
      calendarDay: '2026-07-08',
      recordId: 'record-id',
    });
    const secondDayDraggableId = getRecordCalendarCardDraggableId({
      calendarDay: '2026-07-09',
      recordId: 'record-id',
    });

    expect(firstDayDraggableId).not.toBe(secondDayDraggableId);
  });
});
