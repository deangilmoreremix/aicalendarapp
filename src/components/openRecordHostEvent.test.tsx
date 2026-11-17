import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return { ...actual, calendarEventApi: { ...actual.calendarEventApi, update: api.update, getSettings: vi.fn() } };
});

import { OpenRecordHost } from './OpenRecordHost';
import { useOpenRecordStore } from '../store/openRecordStore';
import { useTaskStore } from '../store/taskStore';

describe('OpenRecordHost: editing an event from the command menu', () => {
  it('patches the loaded event so the calendar does not keep the old values', async () => {
    api.update.mockResolvedValue(undefined);
    useTaskStore.setState({
      calendarEvents: [
        { id: 'e1', title: 'Old title', startDate: new Date(2031, 0, 5, 9), endDate: new Date(2031, 0, 5, 10), isAllDay: false } as any
      ]
    });
    useOpenRecordStore.setState({ target: { type: 'event', id: 'e1' } as any });
    render(<OpenRecordHost />);
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(api.update).toHaveBeenCalled());
    await waitFor(() => expect(useTaskStore.getState().calendarEvents[0].title).toBe('New title'));
  });
});
