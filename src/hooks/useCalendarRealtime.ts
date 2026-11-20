/**
 * Ours (glue): keep the calendar current when someone else (another tab, another person) changes data.
 * Twenty's record calendar subscribes to server-sent events (`RecordCalendarSSESubscribeEffect`) and refetches; here the
 * same idea runs on Supabase Realtime (`postgres_changes`), so it needs no extra service. Changes arrive in bursts, so
 * they are collected for a moment and each table is refreshed once.
 */
import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import { taskApi, dealApi, contactApi, invalidateBlocklistCache } from '../services/api';
import { CALENDAR_BLOCKLIST_CHANGED, CALENDAR_DATA_CHANGED } from '../lib/calendarPreferences';
import { useTaskStore, getTaskWriteEpoch, taskWritesSettledSince, waitForTaskWrites } from '../store/taskStore';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';

export const REALTIME_TABLES = ['calendar_events', 'calendar_event_participants', 'calendar_event_targets', 'calendar_blocklist', 'crm_tasks', 'deals', 'contacts'] as const;
export type RealtimeTable = (typeof REALTIME_TABLES)[number];

// reload the main calendar's events, then tell open record timelines (Calendar cards) to reload theirs
// (the timelines are told first, so a failing or slow main reload cannot hold them back)
const reloadEventsAndTimelines = async () => {
  window.dispatchEvent(new Event(CALENDAR_DATA_CHANGED));
  await useTaskStore.getState().reloadCalendarEvents();
};

/** A refresher returns 'retry' when it could not apply what it read (a save of our own overlapped every read). */
type RefreshResult = void | 'retry';
const REFRESHERS: Record<RealtimeTable, () => Promise<RefreshResult>> = {
  calendar_events: reloadEventsAndTimelines,
  // guests and links are saved after the event itself: reload when they arrive so no one sees a half-saved event
  calendar_event_participants: reloadEventsAndTimelines,
  calendar_event_targets: reloadEventsAndTimelines,
  // the blocklist decides which events are returned: forget the cached list, then load the events again
  calendar_blocklist: async () => {
    invalidateBlocklistCache();
    // open record timelines (Calendar cards) listen to this event too; the main calendar also reloads through it
    window.dispatchEvent(new Event(CALENDAR_BLOCKLIST_CHANGED));
    await useTaskStore.getState().reloadCalendarEvents();
  },
  crm_tasks: async () => {
    // a read that overlaps a save of one of our own tasks may carry the old state: wait for the saves, read, and apply
    // the result only if no save started or finished meanwhile (otherwise read again; bounded)
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await waitForTaskWrites();
      const epoch = getTaskWriteEpoch();
      const tasks = await taskApi.getAll();
      if (taskWritesSettledSince(epoch)) {
        useTaskStore.setState({ tasks: Object.fromEntries(tasks.map((t) => [t.id, t])) });
        return;
      }
    }
    // still busy: try again a little later instead of dropping what other users or tabs changed
    return 'retry';
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
/** A refresh that could not apply is tried again after this long, at most MAX_REFRESH_RETRIES times in a row. */
export const REFRESH_RETRY_MS = 1000;
const MAX_REFRESH_RETRIES = 3;

export const useCalendarRealtime = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const pending = new Set<RealtimeTable>();
    // one refresh per table at a time: a change that arrives meanwhile is remembered and refreshed once afterwards,
    // so a slower, older fetch can never overwrite a newer one
    const running = new Set<RealtimeTable>();
    const again = new Set<RealtimeTable>();
    const retries = new Map<RealtimeTable, number>();
    const retryTimers = new Set<ReturnType<typeof setTimeout>>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = async (table: RealtimeTable): Promise<void> => {
      if (running.has(table)) {
        again.add(table);
        return;
      }
      running.add(table);
      try {
        const result = await REFRESHERS[table]();
        if (result === 'retry') {
          const used = retries.get(table) ?? 0;
          if (used < MAX_REFRESH_RETRIES) {
            retries.set(table, used + 1);
            const retryTimer = setTimeout(() => {
              retryTimers.delete(retryTimer);
              void refresh(table);
            }, REFRESH_RETRY_MS);
            retryTimers.add(retryTimer);
          }
        } else {
          retries.delete(table);
        }
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
      retryTimers.forEach((t) => clearTimeout(t));
      if (channel) void supabase.removeChannel(channel);
    };
  }, [enabled]);
};
