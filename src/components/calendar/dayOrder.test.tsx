import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const store = vi.hoisted(() => ({
  rescheduleTask: vi.fn(),
  rescheduleCalendarEvent: vi.fn(),
  updateDeal: vi.fn(),
  updateContact: vi.fn()
}));
vi.mock('../../store/taskStore', () => ({ useTaskStore: { getState: () => ({ rescheduleTask: store.rescheduleTask, rescheduleCalendarEvent: store.rescheduleCalendarEvent, error: null }) } }));
vi.mock('../../store/dealStore', () => ({ useDealStore: { getState: () => ({ updateDeal: store.updateDeal, error: null }) } }));
vi.mock('../../store/contactStore', () => ({ useContactStore: { getState: () => ({ updateContact: store.updateContact, error: null }) } }));

// jsdom cannot drag: capture onDragEnd and call it with a drop result
const dnd = vi.hoisted(() => ({ onDragEnd: null as null | ((r: any) => void) }));
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => ((dnd.onDragEnd = onDragEnd), <>{children}</>),
  Droppable: ({ children }: any) => children({ innerRef: () => undefined, droppableProps: {}, placeholder: null }),
  Draggable: ({ children, draggableId, index }: any) =>
    children({ innerRef: () => undefined, draggableProps: {}, dragHandleProps: {} }, { isDragging: false })
}));

import { computeDayDropUpdates, getDayRecords } from './dayOrder';
import { DayRecordsDialog } from './DayRecordsDialog';
import type { UnifiedCalendarRecord } from './unifiedCalendarRecords';

const day = new Date(2026, 10, 12);
const rec = (id: string, type: UnifiedCalendarRecord['type'], position: number, hour = 0): UnifiedCalendarRecord => ({
  key: `${type}:${id}`,
  id,
  type,
  title: id,
  start: new Date(2026, 10, 12, hour),
  end: new Date(2026, 10, 12, hour),
  allDay: hour === 0,
  position,
  isFavorite: false,
  raw: { id } as any
});

describe('getDayRecords', () => {
  it('keeps only that day and orders by position, then time', () => {
    const records = [rec('b', 'deal', 2), rec('a', 'task', 1), rec('t', 'task', 2, 9), { ...rec('x', 'deal', 0), start: new Date(2026, 10, 13) }];
    expect(getDayRecords(records, day).map((r) => r.id)).toEqual(['a', 'b', 't']); // equal positions fall back to time
  });
});

describe('computeDayDropUpdates (Twenty position maths)', () => {
  const list = [rec('a', 'task', 1), rec('b', 'deal', 2), rec('c', 'contact', 3), rec('d', 'event', 4)];
  const drop = (draggedKey: string, destinationIndex: number, dayRecords = list) => computeDayDropUpdates({ dayRecords, draggedKey, destinationIndex });

  it('moves a record between two others (midpoint position)', () => {
    const [u, ...rest] = drop('task:a', 2); // a goes between c and ... index 2 = onto c
    expect(rest).toEqual([]);
    expect(u.record.id).toBe('a');
    expect(u.position).toBeGreaterThan(2);
    expect(u.position).toBeLessThan(4);
  });

  it('moves to the top', () => {
    const [u] = drop('event:d', 0);
    expect(u.position).toBe(0); // target a is at 1, first position = 1 - 1
  });

  it('moves to the end', () => {
    const [u] = drop('task:a', 4);
    expect(u.position).toBe(5);
  });

  it('numbers a day whose records have never been ordered, then saves the whole day', () => {
    const unordered = [rec('a', 'task', 0), rec('b', 'deal', 0), rec('c', 'contact', 0)];
    const updates = drop('contact:c', 0, unordered);
    expect(updates.map((u) => [u.record.id, u.position]).sort()).toEqual([['a', 1], ['b', 2], ['c', 0]]);
  });

  it('does nothing for a single record', () => {
    expect(drop('task:a', 0, [rec('a', 'task', 0)])).toEqual([]);
  });
});

describe('DayRecordsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.rescheduleTask.mockResolvedValue(true);
    store.updateDeal.mockResolvedValue(undefined);
  });
  const records = [rec('a', 'task', 1), rec('b', 'deal', 2), rec('c', 'deal', 3)];

  it('lists the day in saved order', () => {
    render(<DayRecordsDialog day={day} records={records} onClose={vi.fn()} />);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('a'),
      expect.stringContaining('b'),
      expect.stringContaining('c')
    ]);
  });

  it('reorders immediately and saves the new position through the record\'s store', async () => {
    render(<DayRecordsDialog day={day} records={records} onClose={vi.fn()} />);
    await act(async () => dnd.onDragEnd!({ source: { index: 0 }, destination: { index: 2 }, draggableId: 'task:a' }));
    expect(screen.getAllByRole('listitem').map((li) => li.textContent?.replace(/Reorder|Task|Deal/g, '').trim())).toEqual(['b', 'c', 'a']);
    expect(store.rescheduleTask).toHaveBeenCalledWith('a', { position: expect.any(Number) });
    expect(store.rescheduleTask.mock.calls[0][1].position).toBeGreaterThan(2);
  });

  it('puts the order back and shows an error when saving fails', async () => {
    store.rescheduleTask.mockResolvedValue(false);
    render(<DayRecordsDialog day={day} records={records} onClose={vi.fn()} />);
    await act(async () => dnd.onDragEnd!({ source: { index: 0 }, destination: { index: 2 }, draggableId: 'task:a' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not save the new order.'));
    expect(screen.getAllByRole('listitem')[0].textContent).toContain('a');
  });

  it('ignores a drop in place or outside the list', async () => {
    render(<DayRecordsDialog day={day} records={records} onClose={vi.fn()} />);
    await act(async () => dnd.onDragEnd!({ source: { index: 1 }, destination: { index: 1 }, draggableId: 'deal:b' }));
    await act(async () => dnd.onDragEnd!({ source: { index: 1 }, destination: null, draggableId: 'deal:b' }));
    expect(store.rescheduleTask).not.toHaveBeenCalled();
    expect(store.updateDeal).not.toHaveBeenCalled();
  });
});
