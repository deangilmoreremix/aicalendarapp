import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const { getTimeline, create, getSettings, update, searchLinkable, linkToRecord } = vi.hoisted(() => ({
  searchLinkable: vi.fn(),
  linkToRecord: vi.fn(),
  update: vi.fn(),
  getTimeline: vi.fn(),
  create: vi.fn(),
  getSettings: vi.fn()
}));

vi.mock('../../services/api', () => ({
  calendarEventApi: { getTimeline, create, getSettings, update, searchLinkable, linkToRecord },
  activityApi: { getForEntity: () => Promise.resolve([]), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  attachmentApi: { list: () => Promise.resolve([]), upload: vi.fn(), remove: vi.fn(), getDownloadUrl: vi.fn() },
  MAX_ATTACHMENT_BYTES: 25 * 1024 * 1024
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

  it('opens a fresh, empty composer each time (no values left from the previous event)', async () => {
    getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
    create.mockResolvedValue('new-id');
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await screen.findByText('No Events');
    fireEvent.click(screen.getAllByRole('button', { name: /new event/i })[0]);
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Kickoff' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create event' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByLabelText('Title')).toBeNull());
    fireEvent.click(screen.getAllByRole('button', { name: /new event/i })[0]);
    expect(await screen.findByLabelText('Title')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Create event' })).toBeDisabled();
  });

  it('refreshes the main calendar events after an event is created from the card', async () => {
    getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
    create.mockResolvedValue('new-id');
    const reload = vi.fn();
    const { useTaskStore } = await import('../../store/taskStore');
    const original = useTaskStore.getState().reloadCalendarEvents;
    useTaskStore.setState({ reloadCalendarEvents: reload });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await screen.findByText('No Events');
    fireEvent.click(screen.getAllByRole('button', { name: /new event/i })[0]);
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Kickoff' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create event' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    useTaskStore.setState({ reloadCalendarEvents: original });
  });

  it('reloads its timeline when the blocklist changes (a blocked event disappears, an unblocked one appears)', async () => {
    getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await screen.findByText('No Events');
    getTimeline.mockClear();
    window.dispatchEvent(new Event('calendar-blocklist:changed'));
    await waitFor(() => expect(getTimeline).toHaveBeenCalledWith('contact', 'c1', 10, 0));
  });

  it('reloads its timeline when an event, a guest or a link changed elsewhere', async () => {
    getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await screen.findByText('No Events');
    getTimeline.mockClear();
    window.dispatchEvent(new Event('calendar-data:changed'));
    await waitFor(() => expect(getTimeline).toHaveBeenCalledWith('contact', 'c1', 10, 0));
  });

  it('an older first-page response cannot overwrite a newer reload', async () => {
    const oldPage = { totalNumberOfCalendarEvents: 1, timelineCalendarEvents: [event({ id: 'old', title: 'Blocked event', startsAt: '2030-03-15T10:00:00.000Z', endsAt: '2030-03-15T11:00:00.000Z' })] };
    const freshPage = { totalNumberOfCalendarEvents: 1, timelineCalendarEvents: [event({ id: 'new', title: 'Visible event', startsAt: '2030-03-16T10:00:00.000Z', endsAt: '2030-03-16T11:00:00.000Z' })] };
    let finishOld!: (v: unknown) => void;
    getTimeline.mockReturnValueOnce(new Promise((resolve) => { finishOld = resolve; })); // slow first load
    getTimeline.mockResolvedValue(freshPage); // the reload after the blocklist changed
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await waitFor(() => expect(getTimeline).toHaveBeenCalledTimes(1));
    window.dispatchEvent(new Event('calendar-blocklist:changed'));
    expect(await screen.findByText('Visible event')).toBeInTheDocument();
    finishOld(oldPage); // the old read finishes last
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('Blocked event')).toBeNull();
    expect(screen.getByText('Visible event')).toBeInTheDocument();
  });

  it('a pagination page that finishes after a reload is dropped', async () => {
    const observers: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) { observers.push(cb); }
      observe() {}
      disconnect() {}
    });
    const ev = (id: string, title: string, day: string) => event({ id, title, startsAt: `2030-03-${day}T10:00:00.000Z`, endsAt: `2030-03-${day}T11:00:00.000Z` });
    // 2 events shown, 3 in total, so the card asks for more
    getTimeline.mockResolvedValueOnce({ totalNumberOfCalendarEvents: 3, timelineCalendarEvents: [ev('a', 'Event A', '15'), ev('b', 'Event B', '14')] });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await screen.findByText('Event A');
    let finishMore!: (v: unknown) => void;
    getTimeline.mockReturnValueOnce(new Promise((resolve) => { finishMore = resolve; })); // the next page, slow
    observers.at(-1)!([{ isIntersecting: true }]);
    await waitFor(() => expect(getTimeline).toHaveBeenCalledTimes(2));
    // meanwhile a blocklist change reloads: Event B is now blocked
    getTimeline.mockResolvedValueOnce({ totalNumberOfCalendarEvents: 1, timelineCalendarEvents: [ev('a', 'Event A', '15')] });
    window.dispatchEvent(new Event('calendar-blocklist:changed'));
    await waitFor(() => expect(screen.queryByText('Event B')).toBeNull());
    finishMore({ totalNumberOfCalendarEvents: 3, timelineCalendarEvents: [ev('c', 'Event C', '13')] });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('Event C')).toBeNull(); // the old page was not appended
    expect(screen.queryByText('Event B')).toBeNull();
    vi.unstubAllGlobals();
  });

  it('collapses a burst of reload signals into a single reload', async () => {
    getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await screen.findByText('No Events');
    getTimeline.mockClear();
    for (let i = 0; i < 5; i += 1) window.dispatchEvent(new Event('calendar-data:changed'));
    window.dispatchEvent(new Event('calendar-blocklist:changed'));
    await waitFor(() => expect(getTimeline).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 300));
    expect(getTimeline).toHaveBeenCalledTimes(1);
  });

  it('links an existing event to the record from the Link event dialog', async () => {
    getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
    searchLinkable.mockResolvedValue([{ id: 'e7', title: 'Old kickoff', startDate: new Date(2031, 0, 5, 10), endDate: new Date(2031, 0, 5, 11), isAllDay: false }]);
    linkToRecord.mockResolvedValue(undefined);
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await screen.findByText('No Events');
    getTimeline.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /link event/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Link Old kickoff' }));
    await waitFor(() => expect(linkToRecord).toHaveBeenCalledWith('e7', { type: 'contact', id: 'c1' }));
    expect(searchLinkable).toHaveBeenCalledWith({ type: 'contact', id: 'c1' }, '');
    await waitFor(() => expect(getTimeline).toHaveBeenCalled()); // the card reloads to show the linked event
    await waitFor(() => expect(screen.queryByLabelText('Search events')).toBeNull()); // dialog closed
  });

  it('shows an empty list and errors in the Link event dialog', async () => {
    getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
    searchLinkable.mockResolvedValueOnce([]);
    render(<CalendarEventsCard targetType="deal" targetId="d1" objectName="deal" />);
    await screen.findByText('No Events');
    fireEvent.click(screen.getByRole('button', { name: /link event/i }));
    expect(await screen.findByText('No events to link.')).toBeInTheDocument();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    searchLinkable.mockRejectedValueOnce(new Error('down'));
    fireEvent.change(screen.getByLabelText('Search events'), { target: { value: 'x' } });
    expect(await screen.findByText('Could not load events.')).toBeInTheDocument();
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

  it('keeps the saved time zone when an event is edited (title-only save)', async () => {
    update.mockResolvedValue(undefined);
    const editing = { id: 'e9', title: 'Tokyo sync', startDate: new Date('2030-03-01T01:00:00Z'), endDate: new Date('2030-03-01T02:00:00Z'), isAllDay: false, timeZone: 'Asia/Tokyo' } as any;
    render(<CalendarEventComposerModal isOpen onClose={() => {}} onCreated={() => {}} context={{ targets: [] }} editing={editing} />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Tokyo sync v2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][1].timeZone).toBe('Asia/Tokyo');
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
