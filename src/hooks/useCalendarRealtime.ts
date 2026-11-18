/**
 * Ours (glue): keep the calendar current when someone else (another tab, another person) changes data.
 * Twenty's record calendar subscribes to server-sent events (`RecordCalendarSSESubscribeEffect`) and refetches; here the
 * same idea runs on Supabase Realtime (`postgres_changes`), so it needs no extra service. Changes arrive in bursts, so
 * they are collected for a moment and each table is refreshed once.
 */
import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import { taskApi, dealApi, contactApi, invalidateBlocklistCache } from '../services/api';
import { useTaskStore, getTaskWriteEpoch, taskWritesSettledSince } from '../store/taskStore';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';

export const REALTIME_TABLES = ['calendar_events', 'calendar_event_participants', 'calendar_event_targets', 'calendar_blocklist', 'tasks', 'deals', 'contacts'] as const;
export type RealtimeTable = (typeof REALTIME_TABLES)[number];

const REFRESHERS: Record<RealtimeTable, () => Promise<void>> = {
  calendar_events: () => useTaskStore.getState().reloadCalendarEvents(),
  // guests and links are saved after the event itself: reload the events when they arrive so no one sees a half-saved event
  calendar_event_participants: () => useTaskStore.getState().reloadCalendarEvents(),
  calendar_event_targets: () => useTaskStore.getState().reloadCalendarEvents(),
  // the blocklist decides which events are returned: forget the cached list, then load the events again
  calendar_blocklist: async () => {
    invalidateBlocklistCache();
    await useTaskStore.getState().reloadCalendarEvents();
  },
  tasks: async () => {
    // a read that overlaps a save of one of our own tasks may carry the old state: read again instead of applying it
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const epoch = getTaskWriteEpoch();
      const tasks = await taskApi.getAll();
      if (taskWritesSettledSince(epoch)) {
        useTaskStore.setState({ tasks: Object.fromEntries(tasks.map((t) => [t.id, t])) });
        return;
      }
    }
    // still busy: the save itself ends with the saved task in the store, so the next change refreshes the rest
  },
  deals: async () => {
    const deals = await dealApi.getAll();
    useDealStore.setState({ deals: Object.fromEntries(deals.map((d) => [d.id, d])) });
  },
  contacts: async () => {
    const contacts = await contactApi.getAll();
    useContactStore.setState({ contacts: Object.fromEntries(contacts.map((c) => [c.id, c])) });
  }
};

export const REALTIME_DEBOUNCE_MS = 400;

export const useCalendarRealtime = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const pending = new Set<RealtimeTable>();
    // one refresh per table at a time: a change that arrives meanwhile is remembered and refreshed once afterwards,
    // so a slower, older fetch can never overwrite a newer one
    const running = new Set<RealtimeTable>();
    const again = new Set<RealtimeTable>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = async (table: RealtimeTable): Promise<void> => {
      if (running.has(table)) {
        again.add(table);
        return;
      }
      running.add(table);
      try {
        await REFRESHERS[table]();
      } catch (error) {
        console.error(`Realtime refresh of ${table} failed:`, error);
      } finally {
        running.delete(table);
        if (again.delete(table)) void refresh(table);
      }
    };

    const flush = () => {
      timer = undefined;
      const tables = [...pending];
      pending.clear();
      for (const table of tables) void refresh(table);
    };

    const onChange = (table: RealtimeTable) => {
      pending.add(table);
      if (timer === undefined) timer = setTimeout(flush, REALTIME_DEBOUNCE_MS);
    };

    let channel: ReturnType<typeof supabase.channel> | undefined;
    try {
      channel = supabase.channel('calendar-changes');
      for (const table of REALTIME_TABLES) {
        channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange(table));
      }
      channel.subscribe();
    } catch (error) {
      // realtime is an extra: the calendar still works (and refreshes on navigation) without it
      console.error('Realtime subscription failed:', error);
    }

    return () => {
      if (timer !== undefined) clearTimeout(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [enabled]);
};
