import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => ({ create: vi.fn(), link: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return {
    ...actual,
    contactApi: { ...actual.contactApi, create: api.create },
    calendarEventApi: { ...actual.calendarEventApi, linkGuestsToContact: api.link }
  };
});

import { useContactStore } from './contactStore';

describe('importing contacts links their calendar guests', () => {
  beforeEach(() => {
    api.create.mockReset();
    api.link.mockReset();
    api.link.mockResolvedValue(1);
    useContactStore.setState({ contacts: {}, isLoading: false, error: null });
  });

  it('links each created contact (by its email) to the events of matching guests', async () => {
    api.create.mockImplementation(async (c: any, ) => ({ ...c, id: `id-${c.email}` }));
    await useContactStore.getState().importContacts([{ name: 'A', email: 'a@x.io' } as any, { name: 'B', email: 'b@x.io' } as any]);
    await vi.waitFor(() => expect(api.link).toHaveBeenCalledTimes(2));
    expect(api.link.mock.calls.map((c) => c[0].email).sort()).toEqual(['a@x.io', 'b@x.io']);
    expect(Object.keys(useContactStore.getState().contacts)).toHaveLength(2);
  });

  it('a failing link does not fail the import', async () => {
    api.create.mockImplementation(async (c: any) => ({ ...c, id: 'id1' }));
    api.link.mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await useContactStore.getState().importContacts([{ name: 'A', email: 'a@x.io' } as any]);
    await new Promise((r) => setTimeout(r, 10));
    expect(useContactStore.getState().error).toBeNull();
    expect(Object.keys(useContactStore.getState().contacts)).toEqual(['id1']);
  });

  it('tells open Calendar cards to reload when events were linked, and stays quiet when none were', async () => {
    const heard = vi.fn();
    window.addEventListener('calendar-data:changed', heard);
    const { linkGuests } = await import('./contactStore');
    api.link.mockResolvedValue(2);
    await linkGuests({ id: 'c1', email: 'a@x.io' } as any);
    expect(heard).toHaveBeenCalledTimes(1);
    api.link.mockResolvedValue(0);
    await linkGuests({ id: 'c2', email: 'b@x.io' } as any);
    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener('calendar-data:changed', heard);
  });

  it('a batch import tells open Calendar cards once, not once per contact', async () => {
    const heard = vi.fn();
    window.addEventListener('calendar-data:changed', heard);
    api.create.mockImplementation(async (c: any) => ({ ...c, id: `id-${c.email}` }));
    api.link.mockResolvedValue(1);
    await useContactStore.getState().importContacts([
      { name: 'A', email: 'a@x.io' } as any,
      { name: 'B', email: 'b@x.io' } as any,
      { name: 'C', email: 'c@x.io' } as any
    ]);
    await vi.waitFor(() => expect(api.link).toHaveBeenCalledTimes(3));
    await new Promise((r) => setTimeout(r, 10));
    window.removeEventListener('calendar-data:changed', heard);
    expect(heard).toHaveBeenCalledTimes(1);
  });
});
