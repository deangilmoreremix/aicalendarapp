/**
 * Ours (glue): keep the calendar current when someone else (another tab, another person) changes data.
 * Twenty's record calendar subscribes to server-sent events (`RecordCalendarSSESubscribeEffect`) and refetches; here the
 * same idea runs on Supabase Realtime (`postgres_changes`), so it needs no extra service. Changes arrive in bursts, so
 * they are collected for a moment and each table is refreshed once.
 */
import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import { taskApi, dealApi, contactApi } from '../services/api';
import { useTaskStore } from '../store/taskStore';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';

export const REALTIME_TABLES = ['calendar_events', 'tasks', 'deals', 'contacts'] as const;
export type RealtimeTable = (typeof REALTIME_TABLES)[number];

const REFRESHERS: Record<RealtimeTable, () => Promise<void>> = {
  calendar_events: () => useTaskStore.getState().reloadCalendarEvents(),
  tasks: async () => {
    const tasks = await taskApi.getAll();
    useTaskStore.setState({ tasks: Object.fromEntries(tasks.map((t) => [t.id, t])) });
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
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      timer = undefined;
      const tables = [...pending];
      pending.clear();
      for (const table of tables) {
        REFRESHERS[table]().catch((error) => console.error(`Realtime refresh of ${table} failed:`, error));
      }
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
