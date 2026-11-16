import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({ taskUpdate: vi.fn(), dealUpdate: vi.fn(), contactUpdate: vi.fn() }));
vi.mock('../../services/api', async (orig) => {
  const actual = await orig<typeof import('../../services/api')>();
  return {
    ...actual,
    taskApi: { ...actual.taskApi, getAll: vi.fn().mockResolvedValue([]), update: api.taskUpdate },
    dealApi: { ...actual.dealApi, getAll: vi.fn().mockResolvedValue([]), update: api.dealUpdate },
    contactApi: { ...actual.contactApi, getAll: vi.fn().mockResolvedValue([]), update: api.contactUpdate },
    activityApi: { ...actual.activityApi, getAll: vi.fn().mockResolvedValue([]) },
    calendarEventApi: { ...actual.calendarEventApi, getRange: vi.fn().mockResolvedValue([]), getTimeline: vi.fn().mockResolvedValue({ timelineCalendarEvents: [], totalNumberOfCalendarEvents: 0 }) },
    calendarViewApi: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn(), delete: vi.fn(), update: vi.fn() }
  };
});
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

import { toggleFavorite, canFavorite } from './favorites';
import { applyRecordFilters } from './unifiedCalendarRecords';
import { AssigneeAvatar, InlineDueDate, TaskFavoriteStar } from './TaskRowParts';
import { SlotChooser } from './SlotChooser';
import { FavoritesPanel } from '../FavoritesPanel';
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { useOpenRecordStore } from '../../store/openRecordStore';
import { mapTaskFromDB, mapDealFromDB, mapTaskToDB } from '../../services/api';

const task = (over: any = {}) => ({ id: 't1', title: 'Send proposal', priority: 'high', status: 'pending', category: 'other', type: 'other', completed: false, createdAt: new Date(), tags: [], attachments: [], subtasks: [], ...over });

beforeEach(() => {
  vi.clearAllMocks();
  api.taskUpdate.mockImplementation(async (id: string, u: any) => ({ id, title: 'x', priority: 'high', status: 'pending', category: 'other', type: 'other', completed: false, created_at: new Date().toISOString(), tags: [], attachments: [], subtasks: [], ...Object.fromEntries(Object.entries(u).map(([k, v]) => [k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`), v])) }));
  useTaskStore.setState({ tasks: { t1: task() as any }, error: null });
  useDealStore.setState({ deals: {}, error: null });
  useContactStore.setState({ contacts: {}, error: null });
  useOpenRecordStore.setState({ target: null });
});

describe('favorites', () => {
  it('maps is_favorite both ways for tasks and deals', () => {
    expect(mapTaskFromDB({ id: '1', title: 'x', is_favorite: true, created_at: new Date().toISOString(), priority: 'low', status: 'pending', category: 'other', type: 'other', completed: false, tags: [] } as any).isFavorite).toBe(true);
    expect(mapDealFromDB({ id: '1', company: 'c', created_at: '', updated_at: '' } as any).isFavorite).toBe(false);
    expect((mapTaskToDB({ title: 'x', isFavorite: true } as any) as any).is_favorite).toBe(true);
  });

  it('toggles through the store that owns the record, and events cannot be favorited', async () => {
    expect(canFavorite({ type: 'event' })).toBe(false);
    await toggleFavorite({ type: 'task', id: 't1', isFavorite: false });
    expect(api.taskUpdate).toHaveBeenCalledWith('t1', { isFavorite: true });
    useContactStore.setState({ contacts: { c1: { id: 'c1', name: 'Ada' } as any } });
    api.contactUpdate.mockResolvedValue({ id: 'c1', first_name: 'A', last_name: 'L', name: 'Ada', is_favorite: false, created_at: '', updated_at: '' });
    await toggleFavorite({ type: 'contact', id: 'c1', isFavorite: true });
    expect(api.contactUpdate).toHaveBeenCalledWith('c1', { isFavorite: false });
    expect(await toggleFavorite({ type: 'event', id: 'e', isFavorite: false })).toBe(false);
  });

  it('"Favorites only" keeps just starred records', () => {
    const recs = [{ isFavorite: true, title: 'a', start: new Date() }, { isFavorite: false, title: 'b', start: new Date() }] as any;
    expect(applyRecordFilters(recs, { favoritesOnly: true }).map((r) => r.title)).toEqual(['a']);
    expect(applyRecordFilters(recs, {})).toHaveLength(2);
  });

  it('the star button toggles a task', async () => {
    render(<TaskFavoriteStar task={{ id: 't1', isFavorite: false }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
    await waitFor(() => expect(api.taskUpdate).toHaveBeenCalledWith('t1', { isFavorite: true }));
  });

  it('the Favorites block lists starred records and opens them; it is hidden when there are none', () => {
    const { container, rerender } = render(<FavoritesPanel />);
    expect(container).toBeEmptyDOMElement();
    useTaskStore.setState({ tasks: { t1: task({ isFavorite: true }) as any } });
    useDealStore.setState({ deals: { d1: { id: 'd1', company: 'TechCorp', stage: 'negotiation', isFavorite: true } as any } });
    rerender(<FavoritesPanel />);
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    fireEvent.click(screen.getByText('TechCorp'));
    expect(useOpenRecordStore.getState().target).toEqual({ type: 'deal', id: 'd1' });
  });
});

describe('task row parts', () => {
  it('shows an assignee avatar only when there is an assignee', () => {
    const { rerender } = render(<AssigneeAvatar name="Sam Lee" />);
    expect(screen.getByAltText('Sam Lee')).toBeInTheDocument();
    rerender(<AssigneeAvatar />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('changes the due date in place and keeps the time of day', async () => {
    const due = new Date(2026, 10, 12, 15, 30);
    render(<InlineDueDate task={{ id: 't1', title: 'Send proposal', dueDate: due, completed: false }} />);
    fireEvent.click(screen.getByRole('button', { name: /change due date for Send proposal/ }));
    fireEvent.change(screen.getByLabelText('Due date for Send proposal'), { target: { value: '2026-11-20' } });
    await waitFor(() => expect(api.taskUpdate).toHaveBeenCalled());
    const sent = api.taskUpdate.mock.calls[0][1].dueDate as Date;
    expect([sent.getFullYear(), sent.getMonth(), sent.getDate(), sent.getHours(), sent.getMinutes()]).toEqual([2026, 10, 20, 15, 30]);
  });

  it('Escape leaves the date unchanged', () => {
    render(<InlineDueDate task={{ id: 't1', title: 'Send proposal', dueDate: new Date(2026, 10, 12), completed: false }} />);
    fireEvent.click(screen.getByRole('button', { name: /change due date for Send proposal/ }));
    fireEvent.keyDown(screen.getByLabelText('Due date for Send proposal'), { key: 'Escape' });
    expect(screen.queryByLabelText('Due date for Send proposal')).toBeNull();
    expect(api.taskUpdate).not.toHaveBeenCalled();
  });
});

describe('SlotChooser (click an empty day)', () => {
  const contacts = [{ id: 'c1', name: 'Ada Lovelace' }] as any;
  it('offers task, event and follow-up for that day', () => {
    const onChoose = vi.fn();
    render(<SlotChooser day={new Date(2026, 10, 20)} position={{ x: 10, y: 10 }} contacts={contacts} onChoose={onChoose} onFollowUp={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Friday, November 20')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: /New event/ }));
    expect(onChoose).toHaveBeenCalledWith('event');
  });
  it('picks a contact for a follow-up', () => {
    const onFollowUp = vi.fn();
    render(<SlotChooser day={new Date(2026, 10, 20)} position={{ x: 10, y: 10 }} contacts={contacts} onChoose={vi.fn()} onFollowUp={onFollowUp} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Contact follow-up/ }));
    fireEvent.change(screen.getByLabelText('Contact for follow-up'), { target: { value: 'c1' } });
    expect(onFollowUp).toHaveBeenCalledWith('c1');
  });
  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<SlotChooser day={new Date()} position={{ x: 0, y: 0 }} contacts={[]} onChoose={vi.fn()} onFollowUp={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('saved order survives a reload (read mappers)', () => {
  it('reads position for tasks, deals, contacts and events', async () => {
    const { mapContactFromDB, mapCalendarEventFromDB } = await import('../../services/api');
    expect(mapTaskFromDB({ id: '1', title: 'x', position: 2.5, created_at: new Date().toISOString(), priority: 'low', status: 'pending', category: 'other', type: 'other', completed: false, tags: [] } as any).position).toBe(2.5);
    expect(mapDealFromDB({ id: '1', company: 'c', position: -1, created_at: '', updated_at: '' } as any).position).toBe(-1);
    expect(mapContactFromDB({ id: '1', first_name: 'a', last_name: 'b', name: 'a b', position: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).position).toBe(3);
    expect(mapCalendarEventFromDB({ id: 'e', title: 't', start_date: new Date().toISOString(), is_all_day: false, position: 4 } as any).position).toBe(4);
  });
});
