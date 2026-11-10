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

const toRecord = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

// Stores keep entities as Record<id, entity>; these helpers write to them directly.
const setContacts = (items: any[]) => useContactStore.setState({ contacts: toRecord(items) });
const setDeals = (items: any[]) => useDealStore.setState({ deals: toRecord(items) });
const setTasks = (items: any[]) => useTaskStore.setState({ tasks: toRecord(items) });
const setAppointments = (items: any[]) => useAppointmentStore.setState({ appointments: toRecord(items) });

function applyEntityChange<T extends { id: string }>(
  current: Record<string, T>,
  operation: string,
  payload: T
): Record<string, T> {
  if (operation === 'create' || operation === 'update') {
    return { ...current, [payload.id]: payload };
  }
  if (operation === 'delete') {
    const next = { ...current };
    delete next[payload.id];
    return next;
  }
  return current;
}

export function useHostDataSync() {
  const handleInitialDataSync = useCallback((data: InitialDataSync) => {
    console.log('[CRM Embed] Received initial data sync:', data);

    if (data.contacts) setContacts(data.contacts);
    if (data.deals) setDeals(data.deals);
    if (data.tasks) setTasks(data.tasks);
    if (data.appointments) setAppointments(data.appointments);

    if (data.user) {
      console.log('[CRM Embed] User data received:', data.user);
    }
  }, []);

  const handleDataUpdate = useCallback((data: any) => {
    console.log('[CRM Embed] Received data update:', data);

    const { entityType, operation, payload } = data;
    if (!payload) return;

    switch (entityType) {
      case 'contact':
        useContactStore.setState((s) => ({ contacts: applyEntityChange(s.contacts, operation, payload) }));
        break;
      case 'deal':
        useDealStore.setState((s) => ({ deals: applyEntityChange(s.deals, operation, payload) }));
        break;
      case 'task':
        useTaskStore.setState((s) => ({ tasks: applyEntityChange(s.tasks, operation, payload) }));
        break;
      case 'appointment':
        useAppointmentStore.setState((s) => ({ appointments: applyEntityChange(s.appointments, operation, payload) }));
        break;
    }
  }, []);

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
