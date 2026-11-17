import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const rt = vi.hoisted(() => ({
  handlers: {} as Record<string, () => void>,
  channel: null as any,
  removeChannel: vi.fn(),
  reloadEvents: vi.fn(async () => {}),
  taskGetAll: vi.fn(async () => [{ id: 't1', title: 'Fresh task' }]),
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
  taskApi: { getAll: rt.taskGetAll },
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
});
