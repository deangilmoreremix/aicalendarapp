/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-front/src/modules/object-record/record-calendar/record-calendar-card/utils/getRecordCalendarCardDraggableId.ts
 * Changes: import paths. Logic unchanged.
 */
const RECORD_CALENDAR_CARD_DRAGGABLE_ID_PREFIX = 'calendar-card:';

export const getRecordCalendarCardDraggableId = ({
  calendarDay,
  recordId,
}: {
  calendarDay: string;
  recordId: string;
}) =>
  `${RECORD_CALENDAR_CARD_DRAGGABLE_ID_PREFIX}${encodeURIComponent(recordId)}:${calendarDay}`;
