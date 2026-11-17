import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// In-memory "database": tables of rows, each with an is_sample flag. Mimics the two query shapes the API uses.
const db = vi.hoisted(() => ({
  tables: {} as Record<string, { id: string; is_sample: boolean }[]>,
  deleteError: null as Error | null,
  log: [] as string[]
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: (_cols: string, opts?: { head?: boolean }) => ({
        in: async () => ({ data: [], error: null }), // attachments of deleted records (none in these tests)
        eq: async (col: string, val: boolean) => {
          db.log.push(`count ${table} ${col}=${val}`);
          return { count: (db.tables[table] ?? []).filter((r) => r.is_sample === val).length, error: null, data: opts?.head ? null : [] };
        }
      }),
      delete: () => ({
        eq: (col: string, val: boolean) => ({
          select: async () => {
            db.log.push(`delete ${table} ${col}=${val}`);
            if (db.deleteError) return { data: null, error: db.deleteError };
            const gone = (db.tables[table] ?? []).filter((r) => r.is_sample === val);
            db.tables[table] = (db.tables[table] ?? []).filter((r) => r.is_sample !== val);
            return { data: gone.map((r) => ({ id: r.id })), error: null };
          }
        })
      })
    })
  }
}));

import { sampleDataApi } from '../../services/api';
import { MockDataService } from '../../services/mockDataService';
import { DeleteMockDataDialog } from '../../components/ui/DeleteMockDataDialog';
import { useTaskStore } from '../../store/taskStore';
import { useContactStore } from '../../store/contactStore';
import { useDealStore } from '../../store/dealStore';
import { useAppointmentStore } from '../../store/appointmentStore';

const seed = () => {
  db.deleteError = null;
  db.log = [];
  db.tables = {
    tasks: [{ id: 't-sample', is_sample: true }, { id: 't-real', is_sample: false }],
    calendar_events: [{ id: 'e-sample', is_sample: true }],
    activities: [],
    deals: [{ id: 'd-real', is_sample: false }],
    contacts: [{ id: 'c-sample', is_sample: true }, { id: 'c-real', is_sample: false }]
  };
  useTaskStore.setState({
    tasks: { 't-sample': { id: 't-sample' } as any, 't-real': { id: 't-real' } as any },
    calendarEvents: [{ id: 'e-sample' } as any],
    activities: [],
    selectedTask: 't-sample'
  });
  useContactStore.setState({ contacts: { 'c-sample': { id: 'c-sample' } as any, 'c-real': { id: 'c-real' } as any } });
  useDealStore.setState({ deals: { 'd-real': { id: 'd-real' } as any } });
};

beforeEach(seed);

describe('sampleDataApi', () => {
  it('counts only flagged rows', async () => {
    expect(await sampleDataApi.count()).toEqual({ tasks: 1, calendarEvents: 1, activities: 0, contacts: 1, deals: 0 });
  });

  it('deletes only flagged rows, filtering on is_sample = true for every table', async () => {
    const ids = await sampleDataApi.deleteAll();
    expect(ids).toEqual({ tasks: ['t-sample'], calendarEvents: ['e-sample'], activities: [], contacts: ['c-sample'], deals: [] });
    expect(db.log.filter((l) => l.startsWith('delete')).every((l) => l.endsWith('is_sample=true'))).toBe(true);
    expect(db.tables.tasks.map((r) => r.id)).toEqual(['t-real']);
    expect(db.tables.deals.map((r) => r.id)).toEqual(['d-real']);
  });

  it('deletes children (tasks, events, activities) before deals and contacts', async () => {
    await sampleDataApi.deleteAll();
    const order = db.log.filter((l) => l.startsWith('delete')).map((l) => l.split(' ')[1]);
    expect(order.indexOf('tasks')).toBeLessThan(order.indexOf('deals'));
    expect(order.indexOf('deals')).toBeLessThan(order.indexOf('contacts'));
  });

  it('surfaces a database error', async () => {
    db.deleteError = new Error('denied');
    await expect(sampleDataApi.deleteAll()).rejects.toThrow('denied');
  });
});

describe('MockDataService', () => {
  it('removes exactly the sample records from the stores and keeps the user\'s own', async () => {
    const stats = await MockDataService.clearAllMockData();
    expect(Object.keys(useTaskStore.getState().tasks)).toEqual(['t-real']);
    expect(Object.keys(useContactStore.getState().contacts)).toEqual(['c-real']);
    expect(Object.keys(useDealStore.getState().deals)).toEqual(['d-real']);
    expect(useTaskStore.getState().calendarEvents).toEqual([]);
    expect(useTaskStore.getState().selectedTask).toBeNull(); // it pointed at a deleted sample task
    expect(useAppointmentStore.getState().appointments).toEqual({}); // the in-memory demo appointments go too
    expect(stats.tasks).toBe(1);
    expect(stats.contacts).toBe(1);
    expect(stats.total).toBe(stats.tasks + stats.calendarEvents + stats.activities + stats.appointments + stats.contacts + stats.deals);
  });

  it('leaves the stores untouched when the database delete fails', async () => {
    db.deleteError = new Error('denied');
    await expect(MockDataService.clearAllMockData()).rejects.toThrow('denied');
    expect(Object.keys(useTaskStore.getState().tasks).sort()).toEqual(['t-real', 't-sample']);
    expect(Object.keys(useContactStore.getState().contacts).sort()).toEqual(['c-real', 'c-sample']);
  });
});

describe('DeleteMockDataDialog', () => {
  it('shows real counts, deletes on confirm and reports the result', async () => {
    const onClose = vi.fn();
    render(<DeleteMockDataDialog isOpen onClose={onClose} />);
    expect(await screen.findByText('Tasks:')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Delete Sample Data/i }));
    expect(await screen.findByText(/Sample Data Deleted/i)).toBeInTheDocument();
    expect(Object.keys(useTaskStore.getState().tasks)).toEqual(['t-real']);
  });

  it('is empty-state only (no delete button) when nothing is flagged', async () => {
    db.tables = { tasks: [{ id: 't-real', is_sample: false }], calendar_events: [], activities: [], deals: [], contacts: [] };
    useAppointmentStore.setState({ appointments: {} });
    render(<DeleteMockDataDialog isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('No Sample Data Found')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete Sample Data/i })).toBeNull();
  });

  it('shows an error and keeps the data when the delete fails', async () => {
    db.deleteError = new Error('denied');
    render(<DeleteMockDataDialog isOpen onClose={vi.fn()} />);
    await screen.findByText('Tasks:');
    fireEvent.click(screen.getByRole('button', { name: /Delete Sample Data/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Nothing was removed/));
    expect(Object.keys(useTaskStore.getState().tasks).sort()).toEqual(['t-real', 't-sample']);
  });
});
