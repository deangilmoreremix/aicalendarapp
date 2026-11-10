import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const { getTimeline, create, getSettings } = vi.hoisted(() => ({
  getTimeline: vi.fn(),
  create: vi.fn(),
  getSettings: vi.fn()
}));

vi.mock('../../services/api', () => ({
  calendarEventApi: { getTimeline, create, getSettings }
}));

import { CalendarEventsCard } from './CalendarEventsCard';
import { CalendarEventRow } from './CalendarEventRow';
import { CalendarEventComposerModal } from './CalendarEventComposerModal';
import { CalendarChannelVisibility, type TimelineCalendarEvent } from '../../vendor/twenty/calendar/types/generated';

const event = (over: Partial<TimelineCalendarEvent> = {}): TimelineCalendarEvent => ({
  id: 'e1',
  title: 'Renewal review',
  isFullDay: false,
  startsAt: '2030-03-01T10:00:00.000Z',
  endsAt: '2030-03-01T11:00:00.000Z',
  visibility: CalendarChannelVisibility.SHARE_EVERYTHING,
  participants: [],
  ...over
});

describe('CalendarEventRow', () => {
  it('shows the title when everything is shared', () => {
    render(<CalendarEventRow calendarEvent={event()} />);
    expect(screen.getByText('Renewal review')).toBeInTheDocument();
  });

  it('hides the title and is not clickable when only metadata is shared', () => {
    const onOpen = vi.fn();
    render(<CalendarEventRow calendarEvent={event({ visibility: CalendarChannelVisibility.METADATA, title: undefined })} onOpenEvent={onOpen} />);
    expect(screen.getByText('Not shared')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Not shared'));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('labels full-day events', () => {
    render(<CalendarEventRow calendarEvent={event({ isFullDay: true })} />);
    expect(screen.getByText('All day')).toBeInTheDocument();
  });

  it('strikes through canceled events', () => {
    render(<CalendarEventRow calendarEvent={event({ isCanceled: true })} />);
    expect(screen.getByText('Renewal review').className).toContain('line-through');
  });
});

describe('CalendarEventsCard', () => {
  beforeEach(() => {
    getTimeline.mockReset();
    create.mockReset();
    getSettings.mockReset();
    getSettings.mockResolvedValue({ defaultVisibility: CalendarChannelVisibility.SHARE_EVERYTHING });
  });

  it('groups events by month and day', async () => {
    getTimeline.mockResolvedValue({
      totalNumberOfCalendarEvents: 3,
      timelineCalendarEvents: [
        event({ id: 'a', title: 'March call', startsAt: '2030-03-15T10:00:00.000Z', endsAt: '2030-03-15T11:00:00.000Z' }),
        event({ id: 'b', title: 'Feb demo', startsAt: '2030-02-10T10:00:00.000Z', endsAt: '2030-02-10T11:00:00.000Z' }),
        event({ id: 'c', title: 'Feb kickoff', startsAt: '2030-02-10T14:00:00.000Z', endsAt: '2030-02-10T15:00:00.000Z' })
      ]
    });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    expect(await screen.findByText('March call')).toBeInTheDocument();
    expect(screen.getByText('Feb demo')).toBeInTheDocument();
    expect(screen.getByText('Feb kickoff')).toBeInTheDocument();
    expect(screen.getByText('March')).toBeInTheDocument();
    expect(screen.getByText('February')).toBeInTheDocument();
    expect(getTimeline).toHaveBeenCalledWith('contact', 'c1', 10, 0);
  });

  it('shows the empty state with the object name', async () => {
    getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    expect(await screen.findByText('No Events')).toBeInTheDocument();
    expect(screen.getByText(/No events have been scheduled with this contact yet\./)).toBeInTheDocument();
  });

  it('shows an error when loading fails', async () => {
    getTimeline.mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    expect(await screen.findByText('Could not load calendar events.')).toBeInTheDocument();
  });

  it('opens event details for shared events', async () => {
    getTimeline.mockResolvedValue({
      totalNumberOfCalendarEvents: 1,
      timelineCalendarEvents: [event({ location: 'Room 4', description: 'Agenda items' })]
    });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    fireEvent.click(await screen.findByText('Renewal review'))
    expect(await screen.findByText('Room 4')).toBeInTheDocument();
    expect(screen.getByText('Agenda items')).toBeInTheDocument();
  });
});

describe('CalendarEventComposerModal', () => {
  beforeEach(() => {
    create.mockReset();
    getSettings.mockReset();
    getSettings.mockResolvedValue({ defaultVisibility: CalendarChannelVisibility.METADATA });
  });

  const context = {
    targets: [{ type: 'contact' as const, id: 'c1' }],
    defaultAttendee: { handle: 'ada@x.io', displayName: 'Ada Lovelace', contactId: 'c1' }
  };

  it('prefills the contact as a guest and uses the default visibility', async () => {
    create.mockResolvedValue('new-id');
    const onCreated = vi.fn();
    render(<CalendarEventComposerModal isOpen onClose={() => {}} onCreated={onCreated} context={context} />);

    expect(screen.getByDisplayValue('ada@x.io')).toBeInTheDocument();
    const create_btn = screen.getByRole('button', { name: 'Create event' });
    expect(create_btn).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Kickoff' } });
    await waitFor(() => expect(create_btn).toBeEnabled());
    fireEvent.click(create_btn);

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    const input = create.mock.calls[0][0];
    expect(input.title).toBe('Kickoff');
    expect(input.visibility).toBe(CalendarChannelVisibility.METADATA);
    expect(input.attendees).toEqual([{ handle: 'ada@x.io', displayName: 'Ada Lovelace', contactId: 'c1' }]);
    expect(input.targets).toEqual([{ type: 'contact', id: 'c1' }]);
    expect(Date.parse(input.endsAt)).toBeGreaterThan(Date.parse(input.startsAt));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
  });

  it('flags invalid guest emails and blocks creation', async () => {
    render(<CalendarEventComposerModal isOpen onClose={() => {}} onCreated={() => {}} context={{ targets: [] }} />);
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/), { target: { value: 'not-an-email' } });
    expect(screen.getByText(/Invalid email: not-an-email/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create event' })).toBeDisabled();
  });

  it('switches to date inputs for all-day events', () => {
    const { container } = render(<CalendarEventComposerModal isOpen onClose={() => {}} onCreated={() => {}} context={{ targets: [] }} />);
    expect(container.querySelectorAll('input[type="datetime-local"]').length).toBe(2);
    fireEvent.click(screen.getByLabelText('All day'));
    expect(container.querySelectorAll('input[type="date"]').length).toBe(2);
    expect(container.querySelectorAll('input[type="datetime-local"]').length).toBe(0);
  });
});
