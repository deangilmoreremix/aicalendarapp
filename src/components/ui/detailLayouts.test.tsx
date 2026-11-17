import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CalendarEventDetailsModal } from '../calendar/CalendarEventDetailsModal';
import { LayoutToggle } from './LayoutToggle';
import { useDetailLayoutStore } from '../../store/detailLayoutStore';

const KEY = 'ai-calendar:detail-layouts';
const event: any = {
  id: 'e1',
  title: 'Kickoff',
  isFullDay: false,
  startsAt: '2026-11-12T10:00:00.000Z',
  endsAt: '2026-11-12T11:00:00.000Z',
  location: 'Room 4',
  description: 'Agenda: scope and owners',
  visibility: 'SHARE_EVERYTHING',
  participants: [{ handle: 'ada@x.io', displayName: 'Ada', firstName: 'Ada', lastName: '', avatarUrl: '' }]
};

beforeEach(() => {
  localStorage.clear();
  useDetailLayoutStore.setState({ layouts: { task: 'full', deal: 'full', contact: 'full', event: 'full' } });
});

describe('detail layouts', () => {
  it('defaults to the full layout', () => {
    render(<CalendarEventDetailsModal event={event} onClose={vi.fn()} />);
    expect(screen.getByText('Agenda: scope and owners')).toBeInTheDocument();
    expect(screen.getByText('Guests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Full' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('compact keeps the key facts (when, where) and hides description and guests; switching back restores them', () => {
    render(<CalendarEventDetailsModal event={event} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compact' }));
    expect(screen.getByText('Room 4')).toBeInTheDocument();
    expect(screen.queryByText('Agenda: scope and owners')).toBeNull();
    expect(screen.queryByText('Guests')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Full' }));
    expect(screen.getByText('Agenda: scope and owners')).toBeInTheDocument();
  });

  it('remembers the choice per record type', () => {
    const { unmount } = render(<LayoutToggle kind="event" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compact' }));
    unmount();
    render(<LayoutToggle kind="deal" />);
    expect(screen.getByRole('button', { name: 'Full' })).toHaveAttribute('aria-pressed', 'true'); // deal is separate
    expect(JSON.parse(localStorage.getItem(KEY)!)).toMatchObject({ event: 'compact', deal: 'full' });
  });

  it('keeps working when storage is unavailable', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<LayoutToggle kind="task" />);
    fireEvent.click(screen.getByRole('button', { name: 'Compact' }));
    expect(screen.getByRole('button', { name: 'Compact' })).toHaveAttribute('aria-pressed', 'true'); // still applies for this session
    setItem.mockRestore();
  });
});
