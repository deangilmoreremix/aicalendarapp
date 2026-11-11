/**
 * Glue (ours, not upstream code): persists calendar changes through the existing stores/services.
 * Twenty's equivalent (useProcessCalendarCardDrop) writes through its GraphQL record store; ours writes through
 * taskStore / dealStore / contactStore / calendarEventApi, using the date updates computed by the upstream helpers.
 */
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { calendarEventApi } from '../../services/api';
import type { CalendarEvent, Deal, Task } from '../../types';
import { CalendarChannelVisibility } from '../../vendor/twenty/calendar/shared/CalendarChannelVisibility';
import {
  getShiftedRecordUpdates,
  type RescheduleUpdates,
  type UnifiedCalendarRecord
} from './unifiedCalendarRecords';

/** Persist a reschedule. Resolves to false (and rolls back where the store supports it) when saving fails. */
export const applyRescheduleUpdates = async (record: UnifiedCalendarRecord, updates: RescheduleUpdates): Promise<boolean> => {
  switch (record.type) {
    case 'task':
      return updates.task ? useTaskStore.getState().rescheduleTask(record.id, updates.task) : false;
    case 'event':
      return updates.event ? useTaskStore.getState().rescheduleCalendarEvent(record.id, updates.event) : false;
    case 'deal': {
      if (!updates.deal) return false;
      await useDealStore.getState().updateDeal(record.id, updates.deal);
      return !useDealStore.getState().error;
    }
    case 'contact': {
      if (!updates.contact) return false;
      await useContactStore.getState().updateContact(record.id, updates.contact);
      return !useContactStore.getState().error;
    }
  }
};

/** Reschedule by a number of days (context menu: tomorrow / next week). */
export const rescheduleRecordByDays = (record: UnifiedCalendarRecord, days: number) =>
  applyRescheduleUpdates(record, getShiftedRecordUpdates(record, days));

export const duplicateRecord = async (record: UnifiedCalendarRecord): Promise<boolean> => {
  switch (record.type) {
    case 'task': {
      const { id: _id, createdAt: _createdAt, completedAt: _completedAt, ...rest } = record.raw as Task;
      await useTaskStore.getState().createTask({ ...rest, title: `${rest.title} (copy)`, completed: false, status: 'pending' });
      return !useTaskStore.getState().error;
    }
    case 'deal': {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = record.raw as Deal;
      await useDealStore.getState().createDeal({ ...rest, company: `${rest.company} (copy)` });
      return !useDealStore.getState().error;
    }
    case 'event': {
      const event = record.raw as CalendarEvent;
      try {
        await calendarEventApi.create({
          title: `${event.title} (copy)`,
          description: event.description,
          location: event.location,
          startsAt: event.startDate.toISOString(),
          endsAt: event.endDate.toISOString(),
          isFullDay: event.isAllDay,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          visibility: (event.visibility as CalendarChannelVisibility) ?? CalendarChannelVisibility.SHARE_EVERYTHING,
          conferenceLink: event.conferenceLink,
          attendees: [],
          targets: []
        });
        return true;
      } catch (error) {
        console.error('Failed to duplicate event:', error);
        return false;
      }
    }
    case 'contact':
      return false; // contacts are not duplicated from the calendar
  }
};

export const deleteRecord = async (record: UnifiedCalendarRecord): Promise<boolean> => {
  switch (record.type) {
    case 'task':
      await useTaskStore.getState().deleteTask(record.id);
      return !useTaskStore.getState().error;
    case 'deal':
      await useDealStore.getState().deleteDeal(record.id);
      return !useDealStore.getState().error;
    case 'event':
      return useTaskStore.getState().removeCalendarEvent(record.id);
    case 'contact':
      // A contact is never deleted from the calendar; this only removes it from the calendar by clearing its follow-up.
      await useContactStore.getState().updateContact(record.id, { nextFollowUp: null });
      return !useContactStore.getState().error;
  }
};
