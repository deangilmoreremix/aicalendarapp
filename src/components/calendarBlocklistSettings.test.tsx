import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({ getAll: vi.fn(), add: vi.fn(), remove: vi.fn() }));
vi.mock('../services/api', () => ({
  calendarEventApi: { getSettings: vi.fn().mockResolvedValue({ defaultVisibility: 'SHARE_EVERYTHING' }), setDefaultVisibility: vi.fn() },
  calendarBlocklistApi: api
}));

import { CalendarSettings } from './CalendarSettings';

describe('CalendarSettings: blocklist', () => {
  beforeEach(() => {
    api.getAll.mockReset();
    api.add.mockReset();
    api.remove.mockReset();
  });

  it('lists blocked entries, adds one and removes one, telling an open calendar each time', async () => {
    api.getAll.mockResolvedValueOnce([{ id: 'b1', handle: '@evil.com' }]);
    api.add.mockResolvedValue(undefined);
    api.remove.mockResolvedValue(undefined);
    const heard = vi.fn();
    window.addEventListener('calendar-blocklist:changed', heard);

    render(<CalendarSettings />);
    expect(await screen.findByText('@evil.com')).toBeInTheDocument();

    api.getAll.mockResolvedValueOnce([{ id: 'b1', handle: '@evil.com' }, { id: 'b2', handle: 'spam@x.io' }]);
    fireEvent.change(screen.getByLabelText('Address or domain to block'), { target: { value: ' Spam@X.io ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    await waitFor(() => expect(api.add).toHaveBeenCalledWith('spam@x.io'));
    expect(await screen.findByText('spam@x.io')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Unblock @evil.com' }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('b1'));
    await waitFor(() => expect(screen.queryByText('@evil.com')).toBeNull());
    expect(heard).toHaveBeenCalledTimes(2);
    window.removeEventListener('calendar-blocklist:changed', heard);
  });

  it('shows an empty state and an error when adding fails', async () => {
    api.getAll.mockResolvedValueOnce([]);
    api.add.mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CalendarSettings />);
    expect(await screen.findByText('Nothing is blocked.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Address or domain to block'), { target: { value: 'a@b.io' } });
    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    expect(await screen.findByText('Could not add it to the blocklist.')).toBeInTheDocument();
  });

  it('says so when the list cannot be loaded (not "Nothing is blocked") and offers a retry', async () => {
    api.getAll.mockRejectedValueOnce(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CalendarSettings />);
    expect(await screen.findByText(/Could not load the blocklist/)).toBeInTheDocument();
    expect(screen.queryByText('Nothing is blocked.')).toBeNull();
    api.getAll.mockResolvedValueOnce([{ id: 'b1', handle: '@evil.com' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('@evil.com')).toBeInTheDocument();
  });

  it('tells open calendars about a successful add even when refreshing the list afterwards fails', async () => {
    api.getAll.mockResolvedValueOnce([]);
    api.add.mockResolvedValue(undefined);
    const heard = vi.fn();
    window.addEventListener('calendar-blocklist:changed', heard);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CalendarSettings />);
    await screen.findByText('Nothing is blocked.');
    api.getAll.mockRejectedValueOnce(new Error('down'));
    fireEvent.change(screen.getByLabelText('Address or domain to block'), { target: { value: 'a@b.io' } });
    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    await waitFor(() => expect(heard).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Could not add it to the blocklist.')).toBeNull(); // the add itself worked
    window.removeEventListener('calendar-blocklist:changed', heard);
  });

  it('an older, slower list read cannot bring back an entry that was just removed', async () => {
    api.getAll.mockResolvedValueOnce([{ id: 'b1', handle: '@evil.com' }]);
    api.remove.mockResolvedValue(undefined);
    api.add.mockResolvedValue(undefined);
    render(<CalendarSettings />);
    await screen.findByText('@evil.com');
    // an add starts a refresh that stays slow...
    let slowRead!: (v: unknown) => void;
    api.getAll.mockReturnValueOnce(new Promise((r) => (slowRead = r)));
    fireEvent.change(screen.getByLabelText('Address or domain to block'), { target: { value: 'x@y.io' } });
    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    await waitFor(() => expect(api.add).toHaveBeenCalled());
    await waitFor(() => expect(api.getAll).toHaveBeenCalledTimes(2));
    // ...the entry is removed meanwhile (the fresh load that follows the removal sees the new entry too)...
    api.getAll.mockResolvedValue([{ id: 'b2', handle: 'x@y.io' }]);
    fireEvent.click(screen.getByRole('button', { name: 'Unblock @evil.com' }));
    await waitFor(() => expect(screen.queryByText('@evil.com')).toBeNull());
    // ...and then the old read finishes, still listing it
    slowRead([{ id: 'b1', handle: '@evil.com' }, { id: 'b2', handle: 'x@y.io' }]);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('@evil.com')).toBeNull();
    expect(screen.getByText('x@y.io')).toBeInTheDocument(); // the entry that was just added stays on screen
  });
});

describe('CalendarSettings: clean up events', () => {
  beforeEach(() => {
    api.getAll.mockReset();
    api.getAll.mockResolvedValue([]);
  });

  it('asks first, then removes orphan events and reports how many', async () => {
    const { calendarEventApi } = await import('../services/api');
    (calendarEventApi as any).cleanOrphans = vi.fn().mockResolvedValue(3);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const heard = vi.fn();
    window.addEventListener('calendar-data:changed', heard);
    render(<CalendarSettings />);
    fireEvent.click(await screen.findByRole('button', { name: 'Clean up orphan events' }));
    expect(await screen.findByText('Removed 3 events.')).toBeInTheDocument();
    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener('calendar-data:changed', heard);
  });

  it('does nothing when the confirmation is declined, and reports a failure', async () => {
    const { calendarEventApi } = await import('../services/api');
    const clean = vi.fn().mockRejectedValue(new Error('down'));
    (calendarEventApi as any).cleanOrphans = clean;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CalendarSettings />);
    fireEvent.click(await screen.findByRole('button', { name: 'Clean up orphan events' }));
    expect(clean).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Clean up orphan events' }));
    expect(await screen.findByText('Could not clean up events.')).toBeInTheDocument();
  });
});
