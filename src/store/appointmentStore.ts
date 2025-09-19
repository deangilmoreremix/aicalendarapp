import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'call' | 'task' | 'personal' | 'other';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  attendees?: string[];
  location?: string;
  meetingLink?: string;
  reminders?: number[];
  createdAt: Date;
  updatedAt: Date;
}

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
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type AppointmentStore = AppointmentState & AppointmentActions;

// Sample appointment data
const sampleAppointments: Record<string, Appointment> = {
  '1': {
    id: '1',
    title: 'Team Standup',
    description: 'Daily team standup meeting',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours from now
    type: 'meeting',
    status: 'scheduled',
    attendees: ['john@example.com', 'jane@example.com'],
    location: 'Conference Room A',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    reminders: [15, 5], // 15 minutes and 5 minutes before
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set, get) => ({
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
          // In a real app, this would load from an API
          // For now, we just set the sample data
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load appointments', isLoading: false });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error: typeof error === 'string' ? error : 'An error occurred' });
      },
    }),
    {
      name: 'appointment-store',
      partialize: (state) => ({
        appointments: state.appointments,
        selectedAppointment: state.selectedAppointment,
      }),
    }
  )
);