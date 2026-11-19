import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const rt = vi.hoisted(() => ({
  handlers: {} as Record<string, () => void>,
  channel: null as any,
  removeChannel: vi.fn(),
  reloadEvents: vi.fn(async () => {}),
  invalidate: vi.fn(),
  taskGetAll: vi.fn(async (): Promise<any[]> => [{ id: 't1', title: 'Fresh task' }]),
  taskUpdate: vi.fn(),
  dealGetAll: vi.fn(async () => []),
  contactGetAll: vi.fn(async () => [])
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: () => {
      const channel: any = {
        on: (_type: string, filter: { table: string }, cb: () => void) => {
          rt.handlers[filter.table] = cb;
          return channel;
        },
        subscribe: vi.fn()
      };
      rt.channel = channel;
      return channel;
    },
    removeChannel: rt.removeChannel
  }
}));
vi.mock('../services/api', () => ({
  invalidateBlocklistCache: rt.invalidate,
  taskApi: { getAll: rt.taskGetAll, update: rt.taskUpdate },
  dealApi: { getAll: rt.dealGetAll },
  contactApi: { getAll: rt.contactGetAll }
}));

import { useCalendarRealtime, REALTIME_DEBOUNCE_MS, REALTIME_TABLES } from './useCalendarRealtime';
import { useTaskStore } from '../store/taskStore';

describe('useCalendarRealtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    rt.handlers = {};
    rt.reloadEvents.mockClear();
    rt.taskGetAll.mockClear();
    rt.removeChannel.mockClear();
    useTaskStore.setState({ reloadCalendarEvents: rt.reloadEvents, tasks: {} });
  });
  afterEach(() => vi.useRealTimers());

  it('subscribes to every calendar table', () => {
    renderHook(() => useCalendarRealtime());
    expect(Object.keys(rt.handlers).sort()).toEqual([...REALTIME_TABLES].sort());
  });

  it('refreshes a changed table once after a burst of changes', async () => {
    renderHook(() => useCalendarRealtime());
    rt.handlers.calendar_events();
    rt.handlers.calendar_events();
    rt.handlers.tasks();
    expect(rt.reloadEvents).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 10);
    expect(rt.reloadEvents).toHaveBeenCalledTimes(1);
    expect(rt.taskGetAll).toHaveBeenCalledTimes(1);
    expect(useTaskStore.getState().tasks.t1.title).toBe('Fresh task');
  });

  it('does nothing when disabled and unsubscribes on unmount', () => {
    renderHook(() => useCalendarRealtime(false));
    expect(Object.keys(rt.handlers)).toHaveLength(0);
    const { unmount } = renderHook(() => useCalendarRealtime());
    unmount();
    expect(rt.removeChannel).toHaveBeenCalled();
  });

  it('a blocklist change drops the cached list and reloads the events', async () => {
    rt.invalidate.mockClear();
    renderHook(() => useCalendarRealtime());
    rt.handlers.calendar_blocklist();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 10);
    expect(rt.invalidate).toHaveBeenCalledTimes(1);
    expect(rt.reloadEvents).toHaveBeenCalledTimes(1);
  });

  it('event, guest and link changes tell open record timelines to reload (calendar-data:changed)', async () => {
    const heard = vi.fn();
    window.addEventListener('calendar-data:changed', heard);
    renderHook(() => useCalendarRealtime());
    rt.handlers.calendar_events();
    rt.handlers.calendar_event_participants();
    rt.handlers.calendar_event_targets();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 10);
    window.removeEventListener('calendar-data:changed', heard);
    expect(heard).toHaveBeenCalledTimes(3); // once per refreshed table, after the main calendar reloaded
  });

  it('a blocklist change also tells open record timelines (they listen for calendar-blocklist:changed)', async () => {
    const heard = vi.fn();
    window.addEventListener('calendar-blocklist:changed', heard);
    renderHook(() => useCalendarRealtime());
    rt.handlers.calendar_blocklist();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 10);
    window.removeEventListener('calendar-blocklist:changed', heard);
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('the final read after waiting for saves is checked too: a save that finishes during it is not overwritten by the stale response', async () => {
    useTaskStore.setState({ tasks: { t1: { id: 't1', title: 'T', status: 'pending', completed: false, priority: 'low', tags: [] } as any } });
    // a save is pending, so the first rounds wait for it
    let finishFirstSave!: () => void;
    rt.taskUpdate.mockImplementationOnce(() => new Promise((resolve) => { finishFirstSave = () => resolve({ id: 't1', title: 'T', priority: 'low', tags: [], completed: false, status: 'pending', title2: 1 }); }));
    void useTaskStore.getState().rescheduleTask('t1', { title: 'T' } as any);
    let finishStaleRead!: (v: any[]) => void;
    let reads = 0;
    rt.taskGetAll.mockImplementation(() => {
      reads += 1;
      if (reads === 1) return new Promise((resolve) => { finishStaleRead = resolve; });
      return Promise.resolve([{ id: 't1', title: 'T', completed: true, status: 'completed' }]);
    });
    renderHook(() => useCalendarRealtime());
    rt.handlers.tasks();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 1);
    finishFirstSave();
    await vi.advanceTimersByTimeAsync(10); // the read starts now (old state), no save in flight
    // a completion is saved and finishes while that read is in flight
    rt.taskUpdate.mockImplementation(async (_id: string, u: any) => ({ id: 't1', title: 'T', priority: 'low', tags: [], ...u }));
    await useTaskStore.getState().rescheduleTask('t1', { completed: true, status: 'completed' } as any);
    finishStaleRead([{ id: 't1', title: 'T', completed: false, status: 'pending' }]);
    await vi.advanceTimersByTimeAsync(20);
    expect(useTaskStore.getState().tasks.t1.completed).toBe(true);
  });

  it('never runs two refreshes of one table at once: a change during a refresh gets one more refresh after it', async () => {
    let finishFirst!: () => void;
    let calls = 0;
    rt.taskGetAll.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) await new Promise<void>((r) => (finishFirst = r));
      return [{ id: 't1', title: `fetch ${calls}` }];
    });
    renderHook(() => useCalendarRealtime());
    rt.handlers.tasks();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 10);
    expect(calls).toBe(1); // first fetch is slow and still running
    rt.handlers.tasks(); // another change arrives meanwhile
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 10);
    expect(calls).toBe(1); // not started in parallel
    finishFirst();
    await vi.advanceTimersByTimeAsync(10);
    expect(calls).toBe(2); // one follow-up refresh, after the first finished
    expect(useTaskStore.getState().tasks.t1.title).toBe('fetch 2'); // the newest data wins
    rt.taskGetAll.mockImplementation(async () => [{ id: 't1', title: 'Fresh task' }]);
  });

  it('reloads the events when a guest or a link changes (they are saved after the event itself)', async () => {
    renderHook(() => useCalendarRealtime());
    rt.handlers.calendar_event_participants();
    rt.handlers.calendar_event_targets();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 1);
    expect(rt.reloadEvents).toHaveBeenCalledTimes(2);
  });

  it('a task read that overlaps a save of one of our tasks is not applied (it could carry the old state)', async () => {
    useTaskStore.setState({ tasks: { t1: { id: 't1', title: 'T', status: 'pending', completed: false, priority: 'low', tags: [] } as any } });
    let finishRead!: (v: any[]) => void;
    rt.taskGetAll.mockImplementationOnce(() => new Promise((resolve) => { finishRead = resolve; }));
    rt.taskUpdate.mockImplementation(async (_id: string, u: any) => ({ id: 't1', title: 'T', priority: 'low', tags: [], ...u }));
    renderHook(() => useCalendarRealtime());
    rt.handlers.tasks();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 1); // the read starts (old state, not yet complete)
    await useTaskStore.getState().rescheduleTask('t1', { completed: true, status: 'completed' } as any); // our save finishes meanwhile
    rt.taskGetAll.mockImplementation(async () => [{ id: 't1', title: 'T', completed: true, status: 'completed' }]);
    finishRead([{ id: 't1', title: 'T', completed: false, status: 'pending' }]); // the stale read arrives last
    await vi.advanceTimersByTimeAsync(10);
    expect(useTaskStore.getState().tasks.t1.completed).toBe(true); // not unchecked by the stale read
    expect(rt.taskGetAll.mock.calls.length).toBeGreaterThanOrEqual(2); // it read again instead
  });

  it('unrelated remote changes and deletions still apply when no save overlaps', async () => {
    useTaskStore.setState({ tasks: { t1: { id: 't1' } as any, gone: { id: 'gone' } as any } });
    rt.taskGetAll.mockImplementation(async () => [{ id: 't1', title: 'Fresh task' }, { id: 't2', title: 'New' }]);
    renderHook(() => useCalendarRealtime());
    rt.handlers.tasks();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 1);
    expect(Object.keys(useTaskStore.getState().tasks).sort()).toEqual(['t1', 't2']);
  });

  it.each([
    ['succeeds', true],
    ['fails', false]
  ])('a refresh given up because a save is still pending runs again when that save %s (no later Realtime event needed)', async (_label, succeeds) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useTaskStore.setState({ tasks: { t1: { id: 't1', title: 'T', status: 'pending', completed: false, priority: 'low', tags: [] } as any } });
    let finishSave!: () => void;
    rt.taskUpdate.mockImplementation(() => new Promise((resolve, reject) => {
      finishSave = () => (succeeds ? resolve({ id: 't1', title: 'T', priority: 'low', tags: [], completed: true, status: 'completed' }) : reject(new Error('down')));
    }));
    // a save of our own task is running; a remote creation and deletion are waiting to be read
    void useTaskStore.getState().rescheduleTask('t1', { completed: true, status: 'completed' } as any);
    rt.taskGetAll.mockImplementation(async () => [{ id: 't1', title: 'T', completed: false, status: 'pending' }, { id: 't2', title: 'Remote' }]);
    renderHook(() => useCalendarRealtime());
    rt.handlers.tasks();
    await vi.advanceTimersByTimeAsync(REALTIME_DEBOUNCE_MS + 1);
    expect(Object.keys(useTaskStore.getState().tasks)).toEqual(['t1']); // not applied while the save is pending
    finishSave();
    await vi.advanceTimersByTimeAsync(10);
    expect(Object.keys(useTaskStore.getState().tasks).sort()).toEqual(['t1', 't2']); // the remote change arrived
  });
});
