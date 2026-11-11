import { describe, it, expect } from 'vitest';

import {
  applyRecordFilters,
  buildUnifiedRecords,
  getDayOffset,
  getDropUpdates,
  getShiftedRecordUpdates,
  parseDateOnly
} from './unifiedCalendarRecords';
import { groupTasksByStatus, completionUpdate } from './groupTasksByStatus';
import type { CalendarEvent, Contact, Deal, Task } from '../../types';

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Send proposal',
  priority: 'high',
  status: 'pending',
  category: 'other',
  type: 'other',
  completed: false,
  createdAt: new Date('2030-01-01T00:00:00Z'),
  tags: [],
  attachments: [],
  subtasks: [],
  dueDate: new Date('2030-03-10T12:00:00Z'),
  ...over
});

const deal = (over: Partial<Deal> = {}): Deal => ({
  id: 'd1',
  company: 'TechCorp',
  value: '$85,000',
  probability: '85',
  dueDate: '2030-03-12',
  contactId: 'c1',
  status: 'online',
  stage: 'negotiation',
  priority: 'high',
  createdAt: new Date('2030-01-05T09:00:00Z'),
  updatedAt: new Date('2030-01-05T09:00:00Z'),
  ...over
});

const contact = (over: Partial<Contact> = {}): Contact => ({
  id: 'c1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  name: 'Ada Lovelace',
  email: 'ada@x.io',
  title: 'CTO',
  company: 'Analytical',
  sources: [],
  interestLevel: 'hot',
  status: 'lead',
  tags: [],
  socialProfiles: {},
  customFields: {},
  isFavorite: false,
  createdAt: new Date('2030-01-02T09:00:00Z'),
  updatedAt: new Date('2030-01-02T09:00:00Z'),
  nextFollowUp: '2030-03-14',
  ...over
});

const event = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'e1',
  title: 'Kickoff',
  startDate: new Date('2030-03-15T10:00:00Z'),
  endDate: new Date('2030-03-15T11:00:00Z'),
  isAllDay: false,
  calendarId: 'default',
  type: 'event',
  status: 'scheduled',
  ...over
});

describe('buildUnifiedRecords', () => {
  it('puts tasks, deals, contacts and events on one calendar', () => {
    const records = buildUnifiedRecords({ tasks: [task()], deals: [deal()], contacts: [contact()], events: [event()] });
    expect(records.map((r) => r.type).sort()).toEqual(['contact', 'deal', 'event', 'task']);
    expect(new Set(records.map((r) => r.key)).size).toBe(4);
  });

  it('skips deals whose due date is free text and contacts without a follow-up', () => {
    const records = buildUnifiedRecords({
      tasks: [],
      deals: [deal({ dueDate: 'Tomorrow' }), deal({ id: 'd2', dueDate: '' })],
      contacts: [contact({ nextFollowUp: undefined })],
      events: []
    });
    expect(records).toEqual([]);
  });

  it('shows record-specific subtitles', () => {
    const records = buildUnifiedRecords({ tasks: [task({ assignedUserName: 'Sam' })], deals: [deal()], contacts: [contact()], events: [event({ location: 'Room 4' })] });
    const by = Object.fromEntries(records.map((r) => [r.type, r.subtitle]));
    expect(by.task).toBe('high · Sam');
    expect(by.deal).toBe('$85,000 · negotiation');
    expect(by.contact).toBe('Analytical · CTO');
    expect(by.event).toBe('Room 4');
  });

  it('only shows the selected record types and calendars', () => {
    const base = { tasks: [task()], deals: [deal()], contacts: [contact()], events: [event({ calendarId: 'work' })] };
    expect(buildUnifiedRecords({ ...base, visibleTypes: ['deal'] }).map((r) => r.type)).toEqual(['deal']);
    expect(buildUnifiedRecords({ ...base, visibleTypes: ['event'], visibleCalendars: ['default'] })).toEqual([]);
  });

  it('places records using the chosen date field', () => {
    const records = buildUnifiedRecords({
      tasks: [],
      deals: [deal()],
      contacts: [contact()],
      events: [],
      fieldByType: { deal: 'createdAt', contact: 'createdAt' }
    });
    expect(records.find((r) => r.type === 'deal')!.start.toISOString()).toBe('2030-01-05T09:00:00.000Z');
    expect(records.find((r) => r.type === 'contact')!.start.toISOString()).toBe('2030-01-02T09:00:00.000Z');
  });

  it('keeps tasks with a time block timed, others all-day', () => {
    const [timed, allDay] = buildUnifiedRecords({
      tasks: [
        task({ id: 'a', startTime: new Date('2030-03-10T09:00:00Z'), endTime: new Date('2030-03-10T10:00:00Z') }),
        task({ id: 'b' })
      ],
      deals: [],
      contacts: [],
      events: []
    });
    expect(timed.allDay).toBe(false);
    expect(allDay.allDay).toBe(true);
  });
});

describe('applyRecordFilters', () => {
  const records = buildUnifiedRecords({
    tasks: [task({ assignedUserId: 'u1', status: 'pending' }), task({ id: 't2', title: 'Other', assignedUserId: 'u2', status: 'completed' })],
    deals: [deal()],
    contacts: [],
    events: []
  });

  it('filters by status', () => {
    expect(applyRecordFilters(records, { statuses: ['completed'] }).map((r) => r.id)).toEqual(['t2']);
  });

  it('filters tasks by owner but leaves other record types alone', () => {
    const result = applyRecordFilters(records, { assigneeIds: ['u1'] });
    expect(result.map((r) => r.key).sort()).toEqual(['deal:d1', 'task:t1']);
  });

  it('filters by date range and search text', () => {
    expect(applyRecordFilters(records, { dueDateRange: { from: '2030-03-11', to: '2030-03-31' } }).map((r) => r.type)).toEqual(['deal']);
    expect(applyRecordFilters(records, { searchTerm: 'techcorp' }).map((r) => r.type)).toEqual(['deal']);
  });
});

describe('rescheduling (uses the verbatim upstream shift helpers)', () => {
  const [taskRecord] = buildUnifiedRecords({ tasks: [task()], deals: [], contacts: [], events: [] });
  const [dealRecord] = buildUnifiedRecords({ tasks: [], deals: [deal()], contacts: [], events: [] });
  const [contactRecord] = buildUnifiedRecords({ tasks: [], deals: [], contacts: [contact()], events: [] });
  const [eventRecord] = buildUnifiedRecords({ tasks: [], deals: [], contacts: [], events: [event()] });

  it('shifts a deal due date by whole days', () => {
    expect(getShiftedRecordUpdates(dealRecord, 3).deal).toEqual({ dueDate: '2030-03-15' });
    expect(getShiftedRecordUpdates(dealRecord, -12).deal).toEqual({ dueDate: '2030-02-28' });
  });

  it('shifts a contact follow-up date', () => {
    expect(getShiftedRecordUpdates(contactRecord, 7).contact).toEqual({ nextFollowUp: '2030-03-21' });
  });

  it('shifts every date field of a task and keeps the time of day', () => {
    const [block] = buildUnifiedRecords({
      tasks: [task({ startTime: new Date('2030-03-10T09:00:00Z'), endTime: new Date('2030-03-10T10:30:00Z') })],
      deals: [],
      contacts: [],
      events: []
    });
    const updates = getShiftedRecordUpdates(block, 1, 'UTC').task!;
    expect(updates.dueDate!.toISOString()).toBe('2030-03-11T12:00:00.000Z');
    expect(updates.startTime!.toISOString()).toBe('2030-03-11T09:00:00.000Z');
    expect(updates.endTime!.toISOString()).toBe('2030-03-11T10:30:00.000Z');
    expect(getShiftedRecordUpdates(taskRecord, 2, 'UTC').task!.dueDate!.toISOString()).toBe('2030-03-12T12:00:00.000Z');
  });

  it('shifts both ends of an event', () => {
    const updates = getShiftedRecordUpdates(eventRecord, 1, 'UTC').event!;
    expect(updates.startDate!.toISOString()).toBe('2030-03-16T10:00:00.000Z');
    expect(updates.endDate!.toISOString()).toBe('2030-03-16T11:00:00.000Z');
  });

  it('computes the day offset of a drop in the user time zone', () => {
    expect(getDayOffset(new Date('2030-03-10T12:00:00Z'), new Date('2030-03-13T01:00:00Z'), 'UTC')).toBe(3);
    expect(getDayOffset(new Date('2030-03-10T12:00:00Z'), new Date('2030-03-09T12:00:00Z'), 'UTC')).toBe(-1);
  });

  it('stores the exact new time when a timed event is dropped on the time grid', () => {
    const next = { start: new Date('2030-03-16T14:00:00Z'), end: new Date('2030-03-16T15:00:00Z'), isAllDay: false };
    expect(getDropUpdates(eventRecord, next, 'UTC').event).toEqual({ startDate: next.start, endDate: next.end });
  });

  it('moves all-day records by whole days when dropped on another day', () => {
    const next = { start: new Date(2030, 2, 15), end: new Date(2030, 2, 15), isAllDay: true };
    expect(getDropUpdates(dealRecord, next, 'UTC').deal).toEqual({ dueDate: '2030-03-15' });
  });
});

describe('parseDateOnly', () => {
  it('parses calendar dates and rejects free text', () => {
    expect(parseDateOnly('2030-03-12')?.getDate()).toBe(12);
    expect(parseDateOnly('2030-03-12T10:00:00Z')?.getDate()).toBe(12);
    expect(parseDateOnly('Next Week')).toBeNull();
    expect(parseDateOnly(undefined)).toBeNull();
    expect(parseDateOnly('2030-13-45')).toBeNull();
  });
});

describe('task grouping (upstream TaskGroupsContent rule)', () => {
  it('groups by status sorted by status name descending', () => {
    const groups = groupTasksByStatus([
      task({ id: '1', status: 'pending' }),
      task({ id: '2', status: 'completed' }),
      task({ id: '3', status: 'pending' }),
      task({ id: '4', status: 'in-progress' })
    ]);
    expect(groups.map(([status, list]) => [status, list.length])).toEqual([
      ['pending', 2],
      ['in-progress', 1],
      ['completed', 1]
    ]);
  });

  it('completion flips status and completed flag', () => {
    expect(completionUpdate(true)).toMatchObject({ status: 'completed', completed: true });
    expect(completionUpdate(false)).toMatchObject({ status: 'pending', completed: false, completedAt: undefined });
  });
});
