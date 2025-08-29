import { create } from 'zustand';
import { Appointment } from '../types/task';

interface AppointmentState {
  appointments: Record<string, Appointment>;
  selectedAppointment: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AppointmentActions {
  createAppointment: (appointmentData: Partial<Appointment>) => Promise<void>;
  updateAppointment: (id: string, appointmentData: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  selectAppointment: (id: string | null) => void;
  loadAppointments: () => Promise<void>;
}

type AppointmentStore = AppointmentState & AppointmentActions;

// Sample appointment data
const sampleAppointments: Record<string, Appointment> = {
  '1': {
    id: '1',
    title: 'Client Demo Call',
    description: 'Product demonstration for potential client',
    startTime: new Date(2024, 11, 26, 14, 0),
    endTime: new Date(2024, 11, 26, 15, 0),
    type: 'demo',
    status: 'scheduled',
    attendees: ['john@company.com', 'client@example.com'],
    meetingLink: 'https://meet.google.com/abc-def-ghi',
    reminders: [
      { time: new Date(2024, 11, 26, 13, 45), sent: false }
    ],
    createdAt: new Date(2024, 11, 20),
    updatedAt: new Date(2024, 11, 20),
  },
  '2': {
    id: '2',
    title: 'Sales Presentation',
    description: 'Quarterly sales presentation to stakeholders',
    startTime: new Date(2024, 11, 28, 10, 0),
    endTime: new Date(2024, 11, 28, 11, 30),
    type: 'presentation',
    status: 'scheduled',
    attendees: ['team@company.com', 'stakeholders@company.com'],
    location: 'Conference Room A',
    reminders: [
      { time: new Date(2024, 11, 28, 9, 45), sent: false }
    ],
    createdAt: new Date(2024, 11, 22),
    updatedAt: new Date(2024, 11, 22),
  },
};

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: sampleAppointments,
  selectedAppointment: null,
  isLoading: false,
  error: null,

  createAppointment: async (appointmentData) => {
    set({ isLoading: true, error: null });
    try {
      const newAppointment: Appointment = {
        id: Math.random().toString(36).substr(2, 9),
        title: appointmentData.title || '',
        description: appointmentData.description || '',
        startTime: appointmentData.startTime || new Date(),
        endTime: appointmentData.endTime || new Date(),
        type: appointmentData.type || 'meeting',
        status: appointmentData.status || 'scheduled',
        attendees: appointmentData.attendees || [],
        location: appointmentData.location,
        meetingLink: appointmentData.meetingLink,
        reminders: appointmentData.reminders || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...appointmentData,
      };

      set((state) => ({
        appointments: { ...state.appointments, [newAppointment.id]: newAppointment },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create appointment', isLoading: false });
    }
  },

  updateAppointment: async (id, appointmentData) => {
    set({ isLoading: true, error: null });
    try {
      const currentAppointment = get().appointments[id];
      if (!currentAppointment) {
        throw new Error('Appointment not found');
      }

      const updatedAppointment: Appointment = {
        ...currentAppointment,
        ...appointmentData,
        id,
        updatedAt: new Date(),
      };

      set((state) => ({
        appointments: { ...state.appointments, [id]: updatedAppointment },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update appointment', isLoading: false });
    }
  },

  deleteAppointment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { [id]: deleted, ...remainingAppointments } = get().appointments;
      set({
        appointments: remainingAppointments,
        selectedAppointment: get().selectedAppointment === id ? null : get().selectedAppointment,
        isLoading: false,
      });
    } catch (error) {
      set({ error: 'Failed to delete appointment', isLoading: false });
    }
  },

  selectAppointment: (id) => {
    set({ selectedAppointment: id });
  },

  loadAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load appointments', isLoading: false });
    }
  },
}));