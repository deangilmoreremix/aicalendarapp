import { describe, it, expect, vi } from 'vitest';

const api = vi.hoisted(() => ({ getRange: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return { ...actual, calendarEventApi: { ...actual.calendarEventApi, getRange: api.getRange } };
});

import { useTaskStore } from './taskStore';

const ev = (id: string) => ({ id, title: id, startDate: new Date(), endDate: new Date(), isAllDay: false }) as any;

describe('loadCalendarEvents', () => {
  it('ignores a slower, older range response that finishes after a newer one', async () => {
    let resolveOld!: (v: any[]) => void;
    api.getRange.mockImplementationOnce(() => new Promise((r) => (resolveOld = r)));
    api.getRange.mockResolvedValueOnce([ev('new-month')]);

    const old = useTaskStore.getState().loadCalendarEvents(new Date(2031, 0, 1), new Date(2031, 0, 31));
    await useTaskStore.getState().loadCalendarEvents(new Date(2031, 1, 1), new Date(2031, 1, 28));
    resolveOld([ev('old-month')]);
    await old;

    expect(useTaskStore.getState().calendarEvents.map((e) => e.id)).toEqual(['new-month']);
  });
});
