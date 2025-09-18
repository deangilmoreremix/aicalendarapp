import { useTaskStore } from '../store/taskStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useContactStore } from '../store/contactStore';
import { useDealStore } from '../store/dealStore';

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
   * Get statistics about current mock data in all stores
   */
  static getMockDataStats(): MockDataStats {
    const taskStore = useTaskStore.getState();
    const appointmentStore = useAppointmentStore.getState();
    const contactStore = useContactStore.getState();
    const dealStore = useDealStore.getState();

    const stats: MockDataStats = {
      tasks: Object.keys(taskStore.tasks).length,
      calendarEvents: taskStore.calendarEvents.length,
      activities: taskStore.activities.length,
      appointments: Object.keys(appointmentStore.appointments).length,
      contacts: Object.keys(contactStore.contacts).length,
      deals: Object.keys(dealStore.deals).length,
      total: 0
    };

    stats.total = stats.tasks + stats.calendarEvents + stats.activities +
                  stats.appointments + stats.contacts + stats.deals;

    return stats;
  }

  /**
   * Check if there is any mock data present
   */
  static hasMockData(): boolean {
    const stats = this.getMockDataStats();
    return stats.total > 0;
  }

  /**
   * Clear all mock data from all stores
   */
  static async clearAllMockData(): Promise<MockDataStats> {
    const statsBefore = this.getMockDataStats();

    // Clear task store mock data
    const taskStore = useTaskStore.getState();
    taskStore.tasks = {};
    taskStore.calendarEvents = [];
    taskStore.activities = [];
    taskStore.selectedTask = null;

    // Clear appointment store mock data
    const appointmentStore = useAppointmentStore.getState();
    appointmentStore.appointments = {};
    appointmentStore.selectedAppointment = null;

    // Clear contact store (though it starts empty, clear any user-added data)
    const contactStore = useContactStore.getState();
    contactStore.contacts = {};

    // Clear deal store (though it starts empty, clear any user-added data)
    const dealStore = useDealStore.getState();
    dealStore.deals = {};

    // Force a re-render by updating the stores
    useTaskStore.setState(taskStore);
    useAppointmentStore.setState(appointmentStore);
    useContactStore.setState(contactStore);
    useDealStore.setState(dealStore);

    return statsBefore;
  }

  /**
   * Reset stores to their initial mock data state
   */
  static async resetToMockData(): Promise<void> {
    // First clear all data
    await this.clearAllMockData();

    // Then reload the stores which will reinitialize with mock data
    const taskStore = useTaskStore.getState();
    const appointmentStore = useAppointmentStore.getState();

    // Reinitialize with mock data
    await taskStore.loadTasks();
    await appointmentStore.loadAppointments();
  }

  /**
   * Get a summary of what will be deleted
   */
  static getDeletionSummary(): string {
    const stats = this.getMockDataStats();

    const items = [];
    if (stats.tasks > 0) items.push(`${stats.tasks} tasks`);
    if (stats.calendarEvents > 0) items.push(`${stats.calendarEvents} calendar events`);
    if (stats.activities > 0) items.push(`${stats.activities} activities`);
    if (stats.appointments > 0) items.push(`${stats.appointments} appointments`);
    if (stats.contacts > 0) items.push(`${stats.contacts} contacts`);
    if (stats.deals > 0) items.push(`${stats.deals} deals`);

    if (items.length === 0) {
      return 'No data to delete.';
    }

    return `This will permanently delete: ${items.join(', ')}.`;
  }
}