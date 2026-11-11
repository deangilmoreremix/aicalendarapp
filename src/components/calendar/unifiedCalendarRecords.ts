/**
 * Glue (ours, not upstream code): turns this app's records into calendar records and computes reschedule updates.
 *
 * What comes from twentyhq/twenty (AGPL-3.0, used with permission), see src/vendor/twenty/record-calendar:
 *  - the date shifting (getShiftedRecordCalendarDate*UpdateInput) is used as-is for every reschedule
 *  - day bucketing follows packages/twenty-front/.../record-calendar/states/selectors/calendarDayRecordsComponentFamilySelector.ts:
 *    a DATE field is a PlainDate, a DATE_TIME field is an Instant viewed in the user's time zone
 *  - the visible-record limit constant
 */
import { Temporal } from 'temporal-polyfill';

import type { CalendarEvent, Contact, Deal, Task } from '../../types';
import type { CalendarRecordType, CalendarViewFilters } from '../../services/api';
import type { ObjectRecord } from '../../vendor/twenty/record-calendar/shared/ObjectRecord';
import { getShiftedRecordCalendarDateUpdateInput } from '../../vendor/twenty/record-calendar/drag/getShiftedRecordCalendarDateUpdateInput';
import { getShiftedRecordCalendarDateTimeUpdateInput } from '../../vendor/twenty/record-calendar/drag/getShiftedRecordCalendarDateTimeUpdateInput';

export type UnifiedRecordType = CalendarRecordType;

export interface UnifiedCalendarRecord {
  /** `${type}:${id}`, unique across record types */
  key: string;
  id: string;
  type: UnifiedRecordType;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status?: string;
  ownerId?: string;
  ownerName?: string;
  /** record-specific line shown on the calendar card */
  subtitle?: string;
  raw: Task | Deal | Contact | CalendarEvent;
}

/** Which date field places each record type on the calendar (saved per view). */
export const DEFAULT_FIELD_BY_TYPE: Record<UnifiedRecordType, string> = {
  task: 'dueDate',
  deal: 'dueDate',
  contact: 'nextFollowUp',
  event: 'startDate'
};

export const DATE_FIELD_OPTIONS: Record<UnifiedRecordType, { value: string; label: string }[]> = {
  task: [
    { value: 'dueDate', label: 'Due date' },
    { value: 'startTime', label: 'Start time' }
  ],
  deal: [
    { value: 'dueDate', label: 'Due date' },
    { value: 'createdAt', label: 'Created' }
  ],
  contact: [
    { value: 'nextFollowUp', label: 'Next follow-up' },
    { value: 'createdAt', label: 'Created' }
  ],
  event: [{ value: 'startDate', label: 'Start' }]
};

export const ALL_RECORD_TYPES: UnifiedRecordType[] = ['task', 'deal', 'contact', 'event'];

export const userTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/;

/** Local-midnight Date for a YYYY-MM-DD string; null when the value is not a calendar date (deal.dueDate can be free text). */
export const parseDateOnly = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) return null;
  try {
    const d = Temporal.PlainDate.from(value.slice(0, 10));
    return new Date(d.year, d.month - 1, d.day);
  } catch {
    return null;
  }
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/** Day a record falls on: DATE_TIME fields are viewed in the user's time zone (upstream selector rule). */
export const getRecordPlainDate = (date: Date, kind: 'DATE' | 'DATE_TIME', timeZone = userTimeZone()): Temporal.PlainDate =>
  kind === 'DATE'
    ? Temporal.PlainDate.from({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() })
    : Temporal.Instant.from(date.toISOString()).toZonedDateTimeISO(timeZone).toPlainDate();

interface BuildArgs {
  tasks: Task[];
  deals: Deal[];
  contacts: Contact[];
  events: CalendarEvent[];
  fieldByType?: Partial<Record<UnifiedRecordType, string>>;
  visibleTypes?: UnifiedRecordType[];
  filters?: CalendarViewFilters;
  /** event calendars that are switched on */
  visibleCalendars?: string[];
}

export const buildUnifiedRecords = ({
  tasks,
  deals,
  contacts,
  events,
  fieldByType = {},
  visibleTypes = ALL_RECORD_TYPES,
  filters = {},
  visibleCalendars
}: BuildArgs): UnifiedCalendarRecord[] => {
  const field = (type: UnifiedRecordType) => fieldByType[type] ?? DEFAULT_FIELD_BY_TYPE[type];
  const out: UnifiedCalendarRecord[] = [];

  if (visibleTypes.includes('task')) {
    for (const task of tasks) {
      const timed = !!task.startTime && !!task.endTime;
      const anchor = field('task') === 'startTime' ? task.startTime : task.startTime ?? task.dueDate;
      if (!anchor) continue;
      out.push({
        key: `task:${task.id}`,
        id: task.id,
        type: 'task',
        title: task.title,
        start: task.startTime ?? task.dueDate!,
        end: task.endTime ?? task.dueDate ?? anchor,
        allDay: !timed,
        status: task.status,
        ownerId: task.assignedUserId,
        ownerName: task.assignedUserName,
        subtitle: [task.priority, task.assignedUserName].filter(Boolean).join(' · '),
        raw: task
      });
    }
  }

  if (visibleTypes.includes('deal')) {
    for (const deal of deals) {
      const day = field('deal') === 'createdAt' ? toDate(deal.createdAt) : parseDateOnly(deal.dueDate);
      if (!day) continue; // free-text due dates ("Tomorrow") cannot be placed
      out.push({
        key: `deal:${deal.id}`,
        id: deal.id,
        type: 'deal',
        title: deal.company,
        start: day,
        end: day,
        allDay: true,
        status: deal.stage,
        subtitle: [deal.value, deal.stage].filter(Boolean).join(' · '),
        raw: deal
      });
    }
  }

  if (visibleTypes.includes('contact')) {
    for (const contact of contacts) {
      const day = field('contact') === 'createdAt' ? toDate(contact.createdAt) : parseDateOnly(contact.nextFollowUp);
      if (!day) continue;
      out.push({
        key: `contact:${contact.id}`,
        id: contact.id,
        type: 'contact',
        title: contact.name || `${contact.firstName} ${contact.lastName}`.trim(),
        start: day,
        end: day,
        allDay: true,
        status: contact.status,
        subtitle: [contact.company, contact.title].filter(Boolean).join(' · '),
        raw: contact
      });
    }
  }

  if (visibleTypes.includes('event')) {
    for (const event of events) {
      if (visibleCalendars && !visibleCalendars.includes(event.calendarId)) continue;
      out.push({
        key: `event:${event.id}`,
        id: event.id,
        type: 'event',
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        allDay: event.isAllDay,
        status: event.status,
        subtitle: event.location,
        raw: event
      });
    }
  }

  return applyRecordFilters(out, filters);
};

export const applyRecordFilters = (records: UnifiedCalendarRecord[], filters: CalendarViewFilters): UnifiedCalendarRecord[] => {
  let result = records;
  if (filters.statuses?.length) {
    result = result.filter((r) => !r.status || filters.statuses!.includes(r.status));
  }
  if (filters.assigneeIds?.length) {
    // Only tasks have an owner; other record types are not filtered by it.
    result = result.filter((r) => r.type !== 'task' || (r.ownerId !== undefined && filters.assigneeIds!.includes(r.ownerId)));
  }
  if (filters.dueDateRange?.from || filters.dueDateRange?.to) {
    const from = filters.dueDateRange.from ? new Date(`${filters.dueDateRange.from}T00:00:00`) : undefined;
    const to = filters.dueDateRange.to ? new Date(`${filters.dueDateRange.to}T23:59:59`) : undefined;
    result = result.filter((r) => (!from || r.start >= from) && (!to || r.start <= to));
  }
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    result = result.filter((r) => r.title.toLowerCase().includes(term) || (r.subtitle ?? '').toLowerCase().includes(term));
  }
  return result;
};

export interface RescheduleUpdates {
  task?: Partial<Task>;
  deal?: Partial<Deal>;
  contact?: Partial<Contact>;
  event?: { startDate?: Date; endDate?: Date };
}

const iso = (d?: Date) => (d ? d.toISOString() : undefined);

/**
 * Shift a record by whole days using the verbatim upstream helpers
 * (getShiftedRecordCalendarDateUpdateInput for DATE fields, ...DateTimeUpdateInput for DATE_TIME fields).
 */
export const getShiftedRecordUpdates = (
  record: UnifiedCalendarRecord,
  dayOffset: number,
  timeZone = userTimeZone()
): RescheduleUpdates => {
  const day = (d: Date) => getRecordPlainDate(d, 'DATE_TIME', timeZone).add({ days: dayOffset }).toString();

  switch (record.type) {
    case 'task': {
      const task = record.raw as Task;
      const asRecord: ObjectRecord = { id: task.id, dueDate: iso(task.dueDate), startTime: iso(task.startTime), endTime: iso(task.endTime) };
      const updates: Partial<Task> = {};
      for (const name of ['dueDate', 'startTime', 'endTime'] as const) {
        if (!asRecord[name]) continue;
        const shifted = getShiftedRecordCalendarDateTimeUpdateInput({
          record: asRecord,
          calendarFieldName: name,
          dayOffset,
          timeZone,
          fallbackStartDateTime: asRecord[name]
        });
        updates[name] = new Date(shifted[name] as string);
      }
      return { task: updates };
    }
    case 'deal': {
      const deal = record.raw as Deal;
      const base = parseDateOnly(deal.dueDate) ?? record.start;
      const fallback = day(base);
      const shifted = getShiftedRecordCalendarDateUpdateInput({
        record: { id: deal.id, dueDate: deal.dueDate },
        calendarFieldName: 'dueDate',
        dayOffset,
        fallbackStartDate: fallback
      });
      return { deal: { dueDate: shifted.dueDate as string } };
    }
    case 'contact': {
      const contact = record.raw as Contact;
      const fallback = getRecordPlainDate(record.start, 'DATE').add({ days: dayOffset }).toString();
      const shifted = getShiftedRecordCalendarDateUpdateInput({
        record: { id: contact.id, nextFollowUp: contact.nextFollowUp },
        calendarFieldName: 'nextFollowUp',
        dayOffset,
        fallbackStartDate: fallback
      });
      return { contact: { nextFollowUp: shifted.nextFollowUp as string } };
    }
    case 'event': {
      const event = record.raw as CalendarEvent;
      const asRecord: ObjectRecord = { id: event.id, startDate: iso(event.startDate), endDate: iso(event.endDate) };
      const updates: { startDate?: Date; endDate?: Date } = {};
      for (const name of ['startDate', 'endDate'] as const) {
        const shifted = getShiftedRecordCalendarDateTimeUpdateInput({
          record: asRecord,
          calendarFieldName: name,
          dayOffset,
          timeZone,
          fallbackStartDateTime: asRecord[name]
        });
        updates[name] = new Date(shifted[name] as string);
      }
      return { event: updates };
    }
  }
};

/** Whole-day distance between the record's current day and the day it was dropped on. */
export const getDayOffset = (from: Date, to: Date, timeZone = userTimeZone()): number =>
  getRecordPlainDate(from, 'DATE_TIME', timeZone).until(getRecordPlainDate(to, 'DATE_TIME', timeZone)).days;

/**
 * Updates for a drop on a time grid (week/day views): the calendar hands over the exact new start/end,
 * which is what gets stored for time-blocked tasks and events. Everything else is a whole-day move.
 */
export const getDropUpdates = (
  record: UnifiedCalendarRecord,
  next: { start: Date; end: Date; isAllDay?: boolean },
  timeZone = userTimeZone()
): RescheduleUpdates => {
  const timedRecord = !record.allDay;
  const droppedOnTimeGrid = !next.isAllDay;

  if (timedRecord && droppedOnTimeGrid) {
    if (record.type === 'task') return { task: { startTime: next.start, endTime: next.end } };
    if (record.type === 'event') return { event: { startDate: next.start, endDate: next.end } };
  }

  return getShiftedRecordUpdates(record, getDayOffset(record.start, next.start, timeZone), timeZone);
};
