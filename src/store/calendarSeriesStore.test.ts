import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => ({ update: vi.fn(), delete: vi.fn(), getRange: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return { ...actual, calendarEventApi: { ...actual.calendarEventApi, update: api.update, delete: api.delete, getRange: api.getRange } };
});

import { useTaskStore } from './taskStore';

const occurrence = (i: number) => ({
  id: `s#${i}`, seriesId: 's', occurrenceIndex: i, title: 'Standup', startDate: new Date(2030, 0, 7 + i, 9), endDate: new Date(2030, 0, 7 + i, 10),
  isAllDay: false, calendarId: 'default', type: 'event', status: 'scheduled', recurrenceRule: 'FREQ=DAILY;COUNT=3'
}) as any;
const plain = { id: 'p', title: 'One-off', startDate: new Date(2030, 0, 9, 9), endDate: new Date(2030, 0, 9, 10), isAllDay: false, calendarId: 'default', type: 'event', status: 'scheduled' } as any;

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  api.update.mockResolvedValue({});
  api.delete.mockResolvedValue(undefined);
  api.getRange.mockResolvedValue([]);
  useTaskStore.setState({ calendarEvents: [occurrence(0), occurrence(1), occurrence(2), plain], error: null });
});

describe('repeating events in the store', () => {
  it('deleting one occurrence deletes the stored series and removes all its occurrences, nothing else', async () => {
    expect(await useTaskStore.getState().removeCalendarEvent('s#1')).toBe(true);
    expect(api.delete).toHaveBeenCalledWith('s');
    expect(useTaskStore.getState().calendarEvents.map((e) => e.id)).toEqual(['p']);
  });

  it('deleting a plain event still deletes that event only', async () => {
    await useTaskStore.getState().removeCalendarEvent('p');
    expect(api.delete).toHaveBeenCalledWith('p');
    expect(useTaskStore.getState().calendarEvents).toHaveLength(3);
  });

  it('a failed delete puts the occurrences back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.delete.mockRejectedValue(new Error('down'));
    expect(await useTaskStore.getState().removeCalendarEvent('s#0')).toBe(false);
    expect(useTaskStore.getState().calendarEvents).toHaveLength(4);
  });

  it('saving a change under an occurrence id writes the stored row', async () => {
    await useTaskStore.getState().rescheduleCalendarEvent('s#1', { position: 2 });
    expect(api.update).toHaveBeenCalledWith('s', { position: 2 });
  });

  it('patching an occurrence reloads the range (the whole series changed), a plain event is patched in place', async () => {
    const reload = vi.fn(async () => {});
    useTaskStore.setState({ reloadCalendarEvents: reload });
    useTaskStore.getState().patchCalendarEvent('s#2', { title: 'Renamed' });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(useTaskStore.getState().calendarEvents.find((e) => e.id === 's#2')?.title).toBe('Standup');
    useTaskStore.getState().patchCalendarEvent('p', { title: 'Renamed' });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(useTaskStore.getState().calendarEvents.find((e) => e.id === 'p')?.title).toBe('Renamed');
  });
});
