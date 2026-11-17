import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({
  taskUpdate: vi.fn(), taskDelete: vi.fn(), dealUpdate: vi.fn(), dealDelete: vi.fn(), contactUpdate: vi.fn(), contactDelete: vi.fn(),
  viewsGetAll: vi.fn(), viewsCreate: vi.fn(), viewsDelete: vi.fn()
}));
vi.mock('../../services/api', async (orig) => {
  const actual = await orig<typeof import('../../services/api')>();
  return {
    ...actual,
    taskApi: { ...actual.taskApi, getAll: vi.fn().mockResolvedValue([]), update: api.taskUpdate, delete: api.taskDelete },
    dealApi: { ...actual.dealApi, getAll: vi.fn().mockResolvedValue([]), update: api.dealUpdate, delete: api.dealDelete },
    contactApi: { ...actual.contactApi, getAll: vi.fn().mockResolvedValue([]), update: api.contactUpdate, delete: api.contactDelete },
    recordViewApi: { getAll: api.viewsGetAll, create: api.viewsCreate, delete: api.viewsDelete }
  };
});
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

import { RecordTable } from './RecordTable';
import { applyBulk } from './bulkActions';
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { useOpenRecordStore } from '../../store/openRecordStore';

const contact = (id: string, over: any = {}) => ({ id, firstName: id, lastName: '', name: `Person ${id}`, email: `${id}@x.io`, company: 'Acme', title: 'Dev', status: 'lead', tags: [], isFavorite: false, aiScore: 50, ...over });

beforeEach(() => {
  vi.clearAllMocks();
  api.viewsGetAll.mockResolvedValue([]);
  api.contactUpdate.mockImplementation(async (id: string, u: any) => ({ id, first_name: id, last_name: '', name: `Person ${id}`, email: '', company: 'Acme', title: 'Dev', status: 'lead', tags: [], is_favorite: false, created_at: '', updated_at: '', ...Object.fromEntries(Object.entries(u).map(([k, v]) => [k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`), v])) }));
  api.contactDelete.mockResolvedValue(undefined);
  api.dealUpdate.mockResolvedValue({ id: 'd1', company: 'X', stage: 'proposal', created_at: '', updated_at: '' });
  useOpenRecordStore.setState({ target: null });
  useContactStore.setState({ contacts: { a: contact('a', { aiScore: 90, status: 'customer' }) as any, b: contact('b', { aiScore: 20 }) as any, c: contact('c', { company: 'Globex', aiScore: 60 }) as any }, error: null });
  useDealStore.setState({ deals: { d1: { id: 'd1', company: 'TechCorp', value: '$85,000', stage: 'negotiation', priority: 'high', dueDate: '2026-12-01' } as any, d2: { id: 'd2', company: 'Globex', value: '$9,000', stage: 'proposal', priority: 'low', dueDate: '' } as any }, error: null });
  useTaskStore.setState({ tasks: { t1: { id: 't1', title: 'Send proposal', status: 'pending', priority: 'high', tags: [], completed: false } as any }, error: null });
});

const rowNames = () => screen.getAllByRole('row').slice(1).map((r) => within(r).queryAllByRole('cell')[1]?.textContent);

describe('RecordTable', () => {
  it('lists contacts with the default columns and switches record type', () => {
    render(<RecordTable />);
    expect(rowNames()).toEqual(expect.arrayContaining(['Person a', 'Person b', 'Person c']));
    expect(screen.getByRole('columnheader', { name: /AI score/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Deals' }));
    expect(rowNames()).toEqual(expect.arrayContaining(['TechCorp', 'Globex']));
    expect(screen.queryByRole('columnheader', { name: /AI score/ })).toBeNull();
  });

  it('sorts by clicking a header (asc, desc, off) numerically', () => {
    render(<RecordTable />);
    const header = () => screen.getByRole('button', { name: /AI score/ });
    fireEvent.click(header());
    expect(rowNames()).toEqual(['Person b', 'Person c', 'Person a']);
    fireEvent.click(header());
    expect(rowNames()).toEqual(['Person a', 'Person c', 'Person b']);
    expect(screen.getByRole('columnheader', { name: /AI score/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('searches across fields', () => {
    render(<RecordTable />);
    fireEvent.change(screen.getByLabelText('Search table'), { target: { value: 'globex' } });
    expect(rowNames()).toEqual(['Person c']);
    fireEvent.change(screen.getByLabelText('Search table'), { target: { value: 'zzz' } });
    expect(screen.getByText('No records match the search and filters.')).toBeInTheDocument();
  });

  it('applies advanced rules from the Filters menu', async () => {
    render(<RecordTable />);
    fireEvent.click(screen.getByRole('button', { name: 'Filter table' }));
    fireEvent.click(await screen.findByRole('button', { name: /Add rule/ }));
    fireEvent.change(screen.getByLabelText('Rule 1 field'), { target: { value: 'aiScore' } });
    fireEvent.change(screen.getByLabelText('Rule 1 operator'), { target: { value: 'gt' } });
    fireEvent.change(screen.getByLabelText('Rule 1 value'), { target: { value: '55' } });
    expect(rowNames().sort()).toEqual(['Person a', 'Person c']);
  });

  it('hides and shows columns, never removing the last one', () => {
    render(<RecordTable />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose columns' }));
    fireEvent.click(screen.getByLabelText('Email'));
    expect(screen.queryByRole('columnheader', { name: /Email/ })).toBeNull();
  });

  it('opens the record when a row is clicked, but not when its checkbox is', () => {
    render(<RecordTable />);
    fireEvent.click(screen.getByLabelText('Select Person a'));
    expect(useOpenRecordStore.getState().target).toBeNull();
    fireEvent.click(screen.getByText('Person b'));
    expect(useOpenRecordStore.getState().target).toEqual({ type: 'contact', id: 'b' });
  });

  it('bulk: select rows, favorite them', async () => {
    render(<RecordTable />);
    fireEvent.click(screen.getByLabelText('Select Person a'));
    fireEvent.click(screen.getByLabelText('Select Person b'));
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(within(bar).getByText('2 selected')).toBeInTheDocument();
    fireEvent.click(within(bar).getByRole('button', { name: 'Favorite' }));
    await waitFor(() => expect(api.contactUpdate).toHaveBeenCalledTimes(2));
    expect(api.contactUpdate).toHaveBeenCalledWith('a', { isFavorite: true });
    expect(await screen.findByRole('status')).toHaveTextContent('2 updated.');
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('bulk delete asks first and only deletes on yes', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<RecordTable />);
    fireEvent.click(screen.getByLabelText('Select Person b'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(api.contactDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(api.contactDelete).toHaveBeenCalledWith('b'));
    confirm.mockRestore();
  });

  it('select-all covers the page and pages through results', () => {
    useContactStore.setState({ contacts: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`k${i}`, contact(`k${i}`) as any])) });
    render(<RecordTable />);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Select all on this page'));
    expect(screen.getByText('10 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2
  });

  it('saves the current filters/sort/columns as a view and applies it later', async () => {
    api.viewsCreate.mockImplementation(async (v: any) => ({ id: 'v1', position: 0, ...v }));
    render(<RecordTable />);
    fireEvent.click(screen.getByRole('button', { name: /AI score/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Saved table views' }));
    fireEvent.change(await screen.findByLabelText('Table view name'), { target: { value: 'Low scores' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.viewsCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Low scores', objectType: 'contact', sort: { key: 'aiScore', dir: 'asc' } })));
    expect(await screen.findByText('Low scores')).toBeInTheDocument();
  });
});

describe('applyBulk', () => {
  it('sets a deal stage, marks tasks complete, adds a tag; failures are counted, not thrown', async () => {
    api.taskUpdate.mockResolvedValue({ id: 't1', title: 'x', priority: 'high', status: 'completed', category: 'other', type: 'other', completed: true, created_at: new Date().toISOString(), tags: [], attachments: [], subtasks: [] });
    expect(await applyBulk('deal', ['d1'], { type: 'set', field: 'stage', value: 'proposal' })).toEqual({ done: 1, failed: 0 });
    expect(api.dealUpdate).toHaveBeenCalledWith('d1', { stage: 'proposal' });
    expect(await applyBulk('task', ['t1'], { type: 'complete' })).toEqual({ done: 1, failed: 0 });
    expect(api.taskUpdate).toHaveBeenCalledWith('t1', { completed: true, status: 'completed', completedAt: expect.any(Date) });
    expect(await applyBulk('contact', ['a', 'missing'], { type: 'addTag', tag: 'vip' })).toEqual({ done: 1, failed: 1 });
    expect(api.contactUpdate).toHaveBeenCalledWith('a', { tags: ['vip'] });
  });
});
