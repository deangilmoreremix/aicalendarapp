import { describe, it, expect, vi, beforeEach } from 'vitest';

const fake = vi.hoisted(() => ({ aborted: [] as AbortSignal[], batches: 0 }));
vi.mock('../lib/supabase', () => {
  const result = (data: unknown) => {
    const p: any = Promise.resolve({ data, error: null });
    p.abortSignal = (signal: AbortSignal) => { fake.aborted.push(signal); return p; };
    return p;
  };
  return {
    supabase: {
      rpc: () => result({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] }),
      from: () => ({ select: () => ({ in: () => { fake.batches += 1; return result([]); } }) })
    }
  };
});
import { calendarEventApi } from './api';

beforeEach(() => { fake.aborted = []; fake.batches = 0; });

describe('export requests can be cancelled', () => {
  it('passes the signal to the timeline and details requests', async () => {
    const controller = new AbortController();
    await calendarEventApi.getTimeline('contact', 'c1', 100, 0, controller.signal);
    await calendarEventApi.getExportDetails(['a'], controller.signal);
    expect(fake.aborted).toEqual([controller.signal, controller.signal]);
  });

  it('stops asking for details batches once aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(calendarEventApi.getExportDetails(Array.from({ length: 250 }, (_, i) => `e${i}`), controller.signal)).rejects.toThrow();
    expect(fake.batches).toBe(0);
  });
});
