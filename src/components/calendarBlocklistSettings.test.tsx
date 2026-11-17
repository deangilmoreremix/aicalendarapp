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
});
