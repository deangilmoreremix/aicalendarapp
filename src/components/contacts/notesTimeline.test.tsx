import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({ getForEntity: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), timeline: vi.fn() }));
vi.mock('../../services/api', () => ({
  activityApi: { getForEntity: api.getForEntity, create: api.create, update: api.update, delete: api.remove },
  calendarEventApi: { getTimeline: api.timeline }
}));

import { RecordNotes, noteTitle } from './RecordNotes';
import { RecordTimeline } from './RecordTimeline';

const act = (id: string, type: string, at: Date, extra: any = {}) => ({ id, type, title: id, description: `${id} body`, userId: 'u', userName: 'You', entityType: 'contact', entityId: 'c1', createdAt: at, metadata: {}, ...extra });
const now = new Date();

beforeEach(() => {
  vi.clearAllMocks();
  api.getForEntity.mockResolvedValue([]);
  api.timeline.mockResolvedValue({ timelineCalendarEvents: [], totalNumberOfCalendarEvents: 0 });
  api.create.mockResolvedValue({});
  api.update.mockResolvedValue({});
  api.remove.mockResolvedValue(undefined);
});

describe('RecordNotes', () => {
  it('derives a short title from the first line without markdown marks', () => {
    expect(noteTitle('**Call back** about pricing\nmore')).toBe('Call back about pricing');
    expect(noteTitle('x'.repeat(100))).toHaveLength(58);
    expect(noteTitle('   ')).toBe('Note');
  });

  it('adds a note as a note_added activity on the record', async () => {
    render(<RecordNotes entityType="contact" entityId="c1" />);
    expect(await screen.findByText('No notes yet.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('New note'), { target: { value: '**Hello** team' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'note_added', entityType: 'contact', entityId: 'c1', title: 'Hello team', description: '**Hello** team' }))
    );
  });

  it('does not add an empty note', () => {
    render(<RecordNotes entityType="deal" entityId="d1" />);
    expect(screen.getByRole('button', { name: 'Add note' })).toBeDisabled();
  });

  it('lists only notes, pinned first, rendering formatting', async () => {
    api.getForEntity.mockResolvedValue([
      act('older', 'note_added', new Date(now.getTime() - 9e6), { description: 'older **bold**' }),
      act('mail', 'email_sent', now),
      act('pinned', 'note_added', new Date(now.getTime() - 9e7), { metadata: { pinned: true } })
    ]);
    render(<RecordNotes entityType="contact" entityId="c1" />);
    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('pinned body');
    expect(within(items[1]).getByText('bold').tagName).toBe('STRONG');
  });

  it('edits, pins and deletes a note', async () => {
    api.getForEntity.mockResolvedValue([act('n1', 'note_added', now)]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<RecordNotes entityType="contact" entityId="c1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Pin note' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith('n1', { metadata: { pinned: true } }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    fireEvent.change(screen.getByLabelText('Edit note', { selector: 'textarea' }), { target: { value: 'changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith('n1', { title: 'changed', description: 'changed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete note' }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('n1'));
  });

  it('shows an error and keeps the draft when saving fails', async () => {
    api.create.mockRejectedValue(new Error('down'));
    render(<RecordNotes entityType="contact" entityId="c1" />);
    fireEvent.change(await screen.findByLabelText('New note'), { target: { value: 'keep me' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the note.');
    expect((screen.getByLabelText('New note') as HTMLTextAreaElement).value).toBe('keep me');
  });
});

describe('RecordTimeline', () => {
  it('groups rows by month with typed icons, filters by type, and includes linked calendar events', async () => {
    api.getForEntity.mockResolvedValue([
      act('note1', 'note_added', new Date(2026, 10, 12)),
      act('mail1', 'email_sent', new Date(2026, 10, 3)),
      act('call1', 'call_made', new Date(2026, 8, 20))
    ]);
    api.timeline.mockResolvedValue({ timelineCalendarEvents: [{ id: 'e1', title: 'Renewal call', startsAt: new Date(2026, 9, 9).toISOString() }], totalNumberOfCalendarEvents: 1 });
    render(<RecordTimeline entityId="c1" entityType="contact" />);
    expect(await screen.findByText('November 2026', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('October 2026', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Renewal call')).toBeInTheDocument();
    expect(api.timeline).toHaveBeenCalledWith('contact', 'c1', 50, 0);

    fireEvent.click(screen.getByRole('button', { name: 'Emails' }));
    expect(screen.getByText('mail1')).toBeInTheDocument();
    expect(screen.queryByText('note1')).toBeNull();
    expect(screen.queryByText('Renewal call')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Emails' })); // off again
    expect(screen.getByText('note1')).toBeInTheDocument();
  });

  it('collapses a month and pages with "Load more"', async () => {
    const many = Array.from({ length: 25 }, (_, i) => act(`n${i}`, 'note_added', new Date(2026, 10, 25 - Math.floor(i / 2), 12, i)));
    api.getForEntity.mockResolvedValue(many);
    render(<RecordTimeline entityId="c1" />);
    await screen.findByText('Load more (5 more)');
    fireEvent.click(screen.getByText('Load more (5 more)'));
    expect(screen.queryByText(/Load more/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /November 2026/ }));
    expect(screen.queryByText('n0')).toBeNull();
  });

  it('shows an empty state and an error state', async () => {
    const { unmount } = render(<RecordTimeline entityId="c1" />);
    expect(await screen.findByText('No activity recorded yet.')).toBeInTheDocument();
    unmount();
    api.getForEntity.mockRejectedValue(new Error('x'));
    render(<RecordTimeline entityId="c1" />);
    expect(await screen.findByText('Could not load activity.')).toBeInTheDocument();
  });

  it('does not ask for linked events when the record type is not given', async () => {
    render(<RecordTimeline entityId="c1" />);
    await screen.findByText('No activity recorded yet.');
    expect(api.timeline).not.toHaveBeenCalled();
  });
});
