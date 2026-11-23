import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({
  create: vi.fn(),
  existingIcalUids: vi.fn(),
  getSettings: vi.fn(),
  update: vi.fn(),
  getTimeline: vi.fn(),
  cleanOrphans: vi.fn(),
  getExportDetails: vi.fn()
}));
vi.mock('../../services/api', () => ({
  calendarEventApi: api,
  storedEventId: (id: string) => (id.includes('#') ? id.slice(0, id.indexOf('#')) : id),
  activityApi: { getForEntity: () => Promise.resolve([]), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  attachmentApi: { list: () => Promise.resolve([]), upload: vi.fn(), remove: vi.fn(), getDownloadUrl: vi.fn() },
  MAX_ATTACHMENT_BYTES: 25 * 1024 * 1024
}));
const dl = vi.hoisted(() => ({ downloadTextFile: vi.fn() }));
vi.mock('../../lib/calendar/icsEvents', async (orig) => ({ ...(await orig<typeof import('../../lib/calendar/icsEvents')>()), downloadTextFile: dl.downloadTextFile }));

import { ImportCalendarDialog } from './ImportCalendarDialog';
import { CalendarDataMenu } from './CalendarDataMenu';
import { CalendarEventComposerModal } from './CalendarEventComposerModal';
import { CalendarEventsCard } from './CalendarEventsCard';

const ics = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}END:VCALENDAR\r\n`;
const vevent = (uid: string, title: string, extra = '') => `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTART:20300105T100000Z\r\nDTEND:20300105T110000Z\r\nSUMMARY:${title}\r\n${extra}END:VEVENT\r\n`;
const file = (text: string, name = 'cal.ics') => new File([text], name, { type: 'text/calendar' });

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  dl.downloadTextFile.mockReset();
  api.getSettings.mockResolvedValue({ defaultVisibility: 'SHARE_EVERYTHING' });
  api.existingIcalUids.mockResolvedValue(new Set());
  api.create.mockResolvedValue('id');
  api.getTimeline.mockResolvedValue({ totalNumberOfCalendarEvents: 0, timelineCalendarEvents: [] });
  api.getExportDetails.mockResolvedValue(new Map());
});

describe('ImportCalendarDialog', () => {
  const pick = async (text: string) => {
    render(<ImportCalendarDialog isOpen onClose={() => {}} onImported={onImported} />);
    fireEvent.change(screen.getByLabelText('Calendar file'), { target: { files: [file(text)] } });
  };
  const onImported = vi.fn();
  beforeEach(() => onImported.mockReset());
  /** The Import button is disabled until the file has been read: wait for it, then click. */
  const clickImport = async () => {
    const button = screen.getByRole('button', { name: 'Import' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
  };

  it('shows what the file contains, then saves the events with their uid, guests and repeat rule', async () => {
    await pick(ics(vevent('a@x', 'Kickoff', 'ATTENDEE;CN=Ada:mailto:ada@x.io\r\n') + vevent('b@x', 'Weekly', 'RRULE:FREQ=WEEKLY;COUNT=3\r\n')));
    expect(await screen.findByText(/2 events found in cal.ics/)).toBeInTheDocument();
    expect(screen.getByText('Kickoff')).toBeInTheDocument();
    expect(screen.getByText(/repeats/)).toBeInTheDocument();
    await clickImport();
    expect(await screen.findByRole('status', {}, { timeout: 4000 })).toHaveTextContent('Imported 2');
    expect(api.create).toHaveBeenCalledTimes(2);
    expect(api.create.mock.calls[0][0]).toMatchObject({ title: 'Kickoff', icalUid: 'a@x', attendees: [{ handle: 'ada@x.io', displayName: 'Ada' }], visibility: 'SHARE_EVERYTHING' });
    expect(api.create.mock.calls[1][0]).toMatchObject({ title: 'Weekly', recurrenceRule: 'FREQ=WEEKLY;COUNT=3' });
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it('skips events that are already in the calendar (same uid) and duplicates inside the file', async () => {
    api.existingIcalUids.mockResolvedValue(new Set(['a@x']));
    await pick(ics(vevent('a@x', 'Already') + vevent('b@x', 'New') + vevent('b@x', 'New again')));
    await clickImport();
    expect(await screen.findByRole('status', {}, { timeout: 4000 })).toHaveTextContent('Imported 1, skipped 2 already in the calendar');
    expect(api.create).toHaveBeenCalledTimes(1);
  });

  it('counts events that fail to save and keeps going', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.create.mockRejectedValueOnce(new Error('down')).mockResolvedValue('id');
    await pick(ics(vevent('a@x', 'One') + vevent('b@x', 'Two')));
    await clickImport();
    expect(await screen.findByRole('status', {}, { timeout: 4000 })).toHaveTextContent('Imported 1, 1 could not be saved');
  });

  it('says so when the file has no events, and shows the warnings for skipped ones', async () => {
    await pick('not a calendar');
    expect(await screen.findByText('No events were found in that file.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('lists warnings (cancelled events are skipped)', async () => {
    await pick(ics(vevent('a@x', 'Kept') + vevent('b@x', 'Gone', 'STATUS:CANCELLED\r\n')));
    expect(await screen.findByText(/1 cancelled event skipped/)).toBeInTheDocument();
  });
});

describe('CalendarDataMenu', () => {
  it('exports on click and is disabled when there is nothing to export', async () => {
    const onExport = vi.fn();
    const { rerender } = render(<CalendarDataMenu exportCount={2} onExport={onExport} onImported={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Import \/ Export/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Export events in view/ }));
    expect(onExport).toHaveBeenCalled();
    rerender(<CalendarDataMenu exportCount={0} onExport={onExport} onImported={() => {}} />);
    expect(screen.getByRole('button', { name: /Export events in view/ })).toBeDisabled();
  });

  it('opens the import dialog', async () => {
    render(<CalendarDataMenu exportCount={1} onExport={() => {}} onImported={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Import \/ Export/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Import from .ics file/ }));
    expect(await screen.findByText('Import calendar (.ics)')).toBeInTheDocument();
  });
});

describe('repeat controls in the event editor', () => {
  const open = (props: Partial<React.ComponentProps<typeof CalendarEventComposerModal>> = {}) =>
    render(<CalendarEventComposerModal isOpen onClose={() => {}} onCreated={() => {}} context={{ targets: [] }} {...props} />);

  it('saves a weekly rule with the chosen days and an end count', async () => {
    open();
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Standup' } });
    fireEvent.change(screen.getByLabelText('Repeat'), { target: { value: 'WEEKLY' } });
    fireEvent.change(screen.getByLabelText('Repeat interval'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wed' }));
    fireEvent.change(screen.getByLabelText('Repeat ends'), { target: { value: 'count' } });
    fireEvent.change(screen.getByLabelText('Repeat count'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() => expect(api.create).toHaveBeenCalled());
    expect(api.create.mock.calls[0][0].recurrenceRule).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=6');
  });

  it('an event that does not repeat is saved without a rule', async () => {
    open();
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'One-off' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() => expect(api.create).toHaveBeenCalled());
    expect(api.create.mock.calls[0][0].recurrenceRule).toBeUndefined();
  });

  it('blocks saving while the repeat settings are invalid', async () => {
    open();
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Repeat'), { target: { value: 'DAILY' } });
    fireEvent.change(screen.getByLabelText('Repeat interval'), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Create event' })).toBeDisabled();
    expect(screen.getByText(/Check the repeat settings/)).toBeInTheDocument();
  });

  it('editing one occurrence edits the series: it starts from the series dates and keeps the rule', async () => {
    const first = new Date(2030, 0, 7, 9);
    const occurrence = {
      id: 's#2', seriesId: 's', occurrenceIndex: 2, title: 'Standup', startDate: new Date(2030, 0, 21, 9), endDate: new Date(2030, 0, 21, 9, 30),
      seriesStartDate: first, seriesEndDate: new Date(2030, 0, 7, 9, 30), isAllDay: false, calendarId: 'default', type: 'event', status: 'scheduled',
      recurrenceRule: 'FREQ=WEEKLY;COUNT=5', timeZone: 'UTC'
    } as any;
    api.update.mockResolvedValue({});
    const onCreated = vi.fn();
    open({ editing: occurrence, onCreated });
    expect(await screen.findByLabelText('Repeat')).toHaveValue('WEEKLY');
    expect(screen.getByLabelText('Repeat count')).toHaveValue(5);
    expect(screen.getByText('Changes apply to the whole series.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Standup (renamed)' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(api.update).toHaveBeenCalled());
    const [id, saved] = api.update.mock.calls[0];
    expect(id).toBe('s'); // the stored row, not "s#2"
    expect(saved.startDate.getTime()).toBe(first.getTime()); // not the 21st
    expect(saved.recurrenceRule).toBe('FREQ=WEEKLY;COUNT=5');
  });

  it('turning the repeat off clears the rule', async () => {
    const editing = { id: 's', title: 'Standup', startDate: new Date(2030, 0, 7, 9), endDate: new Date(2030, 0, 7, 10), isAllDay: false, calendarId: 'default', type: 'event', status: 'scheduled', recurrenceRule: 'FREQ=DAILY', timeZone: 'UTC' } as any;
    api.update.mockResolvedValue({});
    open({ editing });
    fireEvent.change(await screen.findByLabelText('Repeat'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(api.update).toHaveBeenCalled());
    expect(api.update.mock.calls[0][1].recurrenceRule).toBeNull();
  });
});

describe('export from a record card', () => {
  it('downloads the shared events as an .ics file and explains when nothing can be exported', async () => {
    api.getTimeline.mockResolvedValue({
      totalNumberOfCalendarEvents: 2,
      timelineCalendarEvents: [
        { id: 'a', title: 'Shared call', isFullDay: false, startsAt: '2030-03-01T10:00:00.000Z', endsAt: '2030-03-01T11:00:00.000Z', visibility: 'SHARE_EVERYTHING', participants: [] },
        { id: 'b', isFullDay: false, startsAt: '2030-03-02T10:00:00.000Z', endsAt: '2030-03-02T11:00:00.000Z', visibility: 'METADATA', participants: [] }
      ]
    });
    render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
    await screen.findByText('Shared call');
    fireEvent.click(screen.getByRole('button', { name: /Export/ }));
    await waitFor(() => expect(dl.downloadTextFile).toHaveBeenCalledTimes(1));
    const [name, text] = dl.downloadTextFile.mock.calls[0];
    expect(name).toBe('contact-events.ics');
    expect(text).toContain('SUMMARY:Shared call');
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(1); // the event without a shared title is left out
  });
});

describe('export timeout', () => {
  it('stops the export when the timeout fires: no more requests and no download after the error', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      api.getTimeline.mockResolvedValueOnce({
        totalNumberOfCalendarEvents: 1,
        timelineCalendarEvents: [{ id: 'a', title: 'Call', isFullDay: false, startsAt: '2030-03-01T10:00:00.000Z', endsAt: '2030-03-01T11:00:00.000Z', visibility: 'SHARE_EVERYTHING', participants: [] }]
      });
      render(<CalendarEventsCard targetType="contact" targetId="c1" objectName="contact" />);
      await screen.findByText('Call');
      let release: (v: unknown) => void = () => {};
      api.getTimeline.mockReturnValueOnce(new Promise((resolve) => { release = resolve; })); // the export's first request hangs
      fireEvent.click(screen.getByRole('button', { name: /Export/ }));
      await vi.advanceTimersByTimeAsync(61_000);
      expect(await screen.findByText('Could not export the events.')).toBeInTheDocument();
      release({ totalNumberOfCalendarEvents: 1, timelineCalendarEvents: [{ id: 'a', title: 'Call', isFullDay: false, startsAt: '2030-03-01T10:00:00.000Z', endsAt: '2030-03-01T11:00:00.000Z', visibility: 'SHARE_EVERYTHING', participants: [] }] });
      await vi.advanceTimersByTimeAsync(10);
      expect(api.getExportDetails).not.toHaveBeenCalled();
      expect(dl.downloadTextFile).not.toHaveBeenCalled();
      expect(api.getTimeline.mock.calls.at(-1)?.[4]?.aborted).toBe(true); // the request in flight was cancelled
    } finally {
      vi.useRealTimers();
    }
  });
});
