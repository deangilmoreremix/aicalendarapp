import { useEffect, useCallback } from 'react';
import { hostCommunication } from '../utils/hostCommunication';
import { useContactStore } from '../store/contactStore';
import { useDealStore } from '../store/dealStore';
import { useTaskStore } from '../store/taskStore';
import { useAppointmentStore } from '../store/appointmentStore';

export interface InitialDataSync {
  contacts?: any[];
  deals?: any[];
  tasks?: any[];
  appointments?: any[];
  user?: any;
}

export function useHostDataSync() {
  const { setContacts } = useContactStore();
  const { setDeals } = useDealStore();
  const { setTasks } = useTaskStore();
  const { setAppointments } = useAppointmentStore();

  const handleInitialDataSync = useCallback((data: InitialDataSync) => {
    console.log('[CRM Embed] Received initial data sync:', data);

    if (data.contacts) {
      setContacts(data.contacts);
    }

    if (data.deals) {
      setDeals(data.deals);
    }

    if (data.tasks) {
      setTasks(data.tasks);
    }

    if (data.appointments) {
      setAppointments(data.appointments);
    }

    if (data.user) {
      console.log('[CRM Embed] User data received:', data.user);
    }
  }, [setContacts, setDeals, setTasks, setAppointments]);

  const handleDataUpdate = useCallback((data: any) => {
    console.log('[CRM Embed] Received data update:', data);

    const { entityType, operation, payload } = data;

    switch (entityType) {
      case 'contact':
        if (operation === 'create' || operation === 'update') {
          const contacts = useContactStore.getState().contacts;
          const existingIndex = contacts.findIndex(c => c.id === payload.id);
          if (existingIndex >= 0) {
            contacts[existingIndex] = payload;
            setContacts([...contacts]);
          } else {
            setContacts([...contacts, payload]);
          }
        } else if (operation === 'delete') {
          const contacts = useContactStore.getState().contacts;
          setContacts(contacts.filter(c => c.id !== payload.id));
        }
        break;

      case 'deal':
        if (operation === 'create' || operation === 'update') {
          const deals = useDealStore.getState().deals;
          const existingIndex = deals.findIndex(d => d.id === payload.id);
          if (existingIndex >= 0) {
            deals[existingIndex] = payload;
            setDeals([...deals]);
          } else {
            setDeals([...deals, payload]);
          }
        } else if (operation === 'delete') {
          const deals = useDealStore.getState().deals;
          setDeals(deals.filter(d => d.id !== payload.id));
        }
        break;

      case 'task':
        if (operation === 'create' || operation === 'update') {
          const tasks = useTaskStore.getState().tasks;
          const existingIndex = tasks.findIndex(t => t.id === payload.id);
          if (existingIndex >= 0) {
            tasks[existingIndex] = payload;
            setTasks([...tasks]);
          } else {
            setTasks([...tasks, payload]);
          }
        } else if (operation === 'delete') {
          const tasks = useTaskStore.getState().tasks;
          setTasks(tasks.filter(t => t.id !== payload.id));
        }
        break;

      case 'appointment':
        if (operation === 'create' || operation === 'update') {
          const appointments = useAppointmentStore.getState().appointments;
          const existingIndex = appointments.findIndex(a => a.id === payload.id);
          if (existingIndex >= 0) {
            appointments[existingIndex] = payload;
            setAppointments([...appointments]);
          } else {
            setAppointments([...appointments, payload]);
          }
        } else if (operation === 'delete') {
          const appointments = useAppointmentStore.getState().appointments;
          setAppointments(appointments.filter(a => a.id !== payload.id));
        }
        break;
    }
  }, [setContacts, setDeals, setTasks, setAppointments]);

  useEffect(() => {
    if (!hostCommunication.getIsEmbedded()) {
      return;
    }

    const unsubscribeInitial = hostCommunication.on('INITIAL_DATA_SYNC', handleInitialDataSync);
    const unsubscribeUpdate = hostCommunication.on('DATA_UPDATE', handleDataUpdate);

    return () => {
      unsubscribeInitial();
      unsubscribeUpdate();
    };
  }, [handleInitialDataSync, handleDataUpdate]);

  const notifyDataChange = useCallback((entityType: string, operation: string, data: any) => {
    hostCommunication.notifyDataChange(entityType, {
      operation,
      payload: data,
      timestamp: Date.now(),
    });
  }, []);

  return { notifyDataChange };
}
