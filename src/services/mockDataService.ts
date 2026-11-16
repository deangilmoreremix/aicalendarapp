import { useTaskStore } from '../store/taskStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useContactStore } from '../store/contactStore';
import { useDealStore } from '../store/dealStore';
import { sampleDataApi } from './api';

export interface MockDataStats {
  tasks: number;
  calendarEvents: number;
  activities: number;
  appointments: number;
  contacts: number;
  deals: number;
  total: number;
}

export class MockDataService {
  /**
   * Counts the sample data that would be deleted: rows flagged is_sample in the database plus the demo
   * appointments that ship in memory. Real (unflagged) records are not counted.
   */
  static async fetchMockDataStats(): Promise<MockDataStats> {
    const db = await sampleDataApi.count();
    const stats: MockDataStats = {
      ...db,
      appointments: Object.keys(useAppointmentStore.getState().appointments).length,
      total: 0
    };
    stats.total = stats.tasks + stats.calendarEvents + stats.activities + stats.appointments + stats.contacts + stats.deals;
    return stats;
  }

  static hasMockData(stats: MockDataStats | null): boolean {
    return !!stats && stats.total > 0;
  }

  /**
   * Deletes the flagged sample rows from the database, then drops exactly those records from the in-memory stores.
   * Throws when the database delete fails (nothing is removed from the screen in that case).
   */
  static async clearAllMockData(): Promise<MockDataStats> {
    const appointmentsBefore = Object.keys(useAppointmentStore.getState().appointments).length;
    const ids = await sampleDataApi.deleteAll();

    const without = <T,>(rec: Record<string, T>, remove: string[]) => {
      const drop = new Set(remove);
      return Object.fromEntries(Object.entries(rec).filter(([id]) => !drop.has(id)));
    };
    const dropEvents = new Set(ids.calendarEvents);
    const dropActivities = new Set(ids.activities);

    useTaskStore.setState((state) => ({
      tasks: without(state.tasks, ids.tasks),
      calendarEvents: state.calendarEvents.filter((e) => !dropEvents.has(e.id)),
      activities: state.activities.filter((a) => !dropActivities.has(a.id)),
      selectedTask: state.selectedTask && ids.tasks.includes(state.selectedTask) ? null : state.selectedTask
    }));
    useContactStore.setState((state) => ({ contacts: without(state.contacts, ids.contacts) }));
    useDealStore.setState((state) => ({ deals: without(state.deals, ids.deals) }));
    // the demo appointments only exist in memory (they are not database rows)
    useAppointmentStore.setState({ appointments: {}, selectedAppointment: null });

    const stats: MockDataStats = {
      tasks: ids.tasks.length,
      calendarEvents: ids.calendarEvents.length,
      activities: ids.activities.length,
      contacts: ids.contacts.length,
      deals: ids.deals.length,
      appointments: appointmentsBefore,
      total: 0
    };
    stats.total = stats.tasks + stats.calendarEvents + stats.activities + stats.appointments + stats.contacts + stats.deals;
    return stats;
  }
}
