/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-front/src/modules/object-record/record-calendar/record-calendar-card/utils/getRecordCalendarCardInstanceIdPrefix.ts
 * Changes: import paths. Logic unchanged.
 */
import { RECORD_CALENDAR_CARD_INPUT_ID_PREFIX } from './RecordCalendarCardInputIdPrefix';

export const getRecordCalendarCardInstanceIdPrefix = (calendarDay: string) =>
  `${RECORD_CALENDAR_CARD_INPUT_ID_PREFIX}-${calendarDay}`;
