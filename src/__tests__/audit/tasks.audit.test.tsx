import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({
  taskGetAll: vi.fn(),
  taskCreate: vi.fn(),
  taskUpdate: vi.fn(),
  taskDelete: vi.fn(),
  contactGetAll: vi.fn(),
  dealGetAll: vi.fn(),
  timeline: vi.fn(),
  activities: vi.fn()
}));

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api')>();
  return {
    ...actual,
    taskApi: { getAll: api.taskGetAll, create: api.taskCreate, update: api.taskUpdate, delete: api.taskDelete },
    contactApi: { ...actual.contactApi, getAll: api.contactGetAll },
    dealApi: { ...actual.dealApi, getAll: api.dealGetAll },
    activityApi: { ...actual.activityApi, getAll: api.activities },
    calendarEventApi: { ...actual.calendarEventApi, getTimeline: api.timeline }
  };
});

// capture the kanban's drag-end handler (jsdom cannot drag)
const dnd = vi.hoisted(() => ({ onDragEnd: null as any }));
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => {
    dnd.onDragEnd = onDragEnd;
    return <>{children}</>;
  },
  Droppable: ({ children, droppableId }: any) =>
    children({ innerRef: () => {}, droppableProps: { 'data-droppable': droppableId }, placeholder: null }, { isDraggingOver: false }),
  Draggable: ({ children, draggableId }: any) =>
    children({ innerRef: () => {}, draggableProps: { 'data-draggable': draggableId }, dragHandleProps: {} }, { isDragging: false })
}));

// stable references, like the real context (useCallback) - a fresh object per render would loop effects that depend on it
const ai = vi.hoisted(() => ({
  predictNextBestAction: vi.fn(async () => 'Call'),
  generateInsights: vi.fn(async () => []),
  generateTaskSuggestions: vi.fn(async () => []),
  isProcessing: false
}));
vi.mock('../../contexts/AIContext', () => ({
  useAI: () => ai,
  AIProvider: ({ children }: any) => <>{children}</>
}));

import { TaskKanbanBoard } from '../../components/TaskKanbanBoard';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import { useTaskStore } from '../../store/taskStore';
import { useContactStore } from '../../store/contactStore';
import { useDealStore } from '../../store/dealStore';
import type { Task } from '../../types';

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Write proposal',
  description: 'Draft it',
  priority: 'high',
  status: 'pending',
  category: 'other',
  type: 'other',
  completed: false,
  createdAt: new Date('2030-01-01T00:00:00Z'),
  tags: ['sales'],
  attachments: [],
  subtasks: [],
  dueDate: new Date('2030-03-10T12:00:00Z'),
  ...over
});

beforeEach(() => {
  vi.clearAllMocks();
  api.taskGetAll.mockResolvedValue([]);
  api.contactGetAll.mockResolvedValue([]);
  api.dealGetAll.mockResolvedValue([]);
  api.activities.mockResolvedValue([]);
  api.timeline.mockResolvedValue({ timelineCalendarEvents: [], totalNumberOfCalendarEvents: 0 });
  api.taskCreate.mockImplementation(async (t: Partial<Task>) => ({ ...task(), ...t, id: 'new1' }));
  api.taskUpdate.mockImplementation(async (id: string, u: Partial<Task>) => ({ ...useTaskStore.getState().tasks[id], ...u }));
  api.taskDelete.mockResolvedValue(undefined);
  useTaskStore.setState({
    tasks: { t1: task(), t2: task({ id: 't2', title: 'Ship release', status: 'in-progress', priority: 'urgent' }), t3: task({ id: 't3', title: 'Old chore', status: 'completed', completed: true }) },
    filters: {},
    error: null,
    isLoading: false,
    selectedTask: null
  });
  useContactStore.setState({ contacts: {} });
  useDealStore.setState({ deals: {} });
});

describe('TaskKanbanBoard', () => {
  it('shows tasks in their status columns', () => {
    render(<TaskKanbanBoard />);
    const column = (title: string) => screen.getByText(title).closest('div.flex.flex-col')!.parentElement as HTMLElement;
    expect(screen.getByText('Write proposal')).toBeInTheDocument();
    expect(screen.getByText('Ship release')).toBeInTheDocument();
    expect(screen.getByText('Old chore')).toBeInTheDocument();
    expect(column('To Do')).toBeTruthy();
  });

  it('moves a task to another column when dropped there', async () => {
    render(<TaskKanbanBoard />);
    await act(async () => {
      await dnd.onDragEnd({ draggableId: 't1', source: { droppableId: 'pending', index: 0 }, destination: { droppableId: 'in-progress', index: 0 } });
    });
    expect(api.taskUpdate).toHaveBeenCalledWith('t1', { status: 'in-progress' });
  });

  it('does nothing for a drop outside a column or onto the same spot', async () => {
    render(<TaskKanbanBoard />);
    await act(async () => {
      await dnd.onDragEnd({ draggableId: 't1', source: { droppableId: 'pending', index: 0 }, destination: null });
      await dnd.onDragEnd({ draggableId: 't1', source: { droppableId: 'pending', index: 0 }, destination: { droppableId: 'pending', index: 0 } });
    });
    expect(api.taskUpdate).not.toHaveBeenCalled();
  });

  it('keeps the completed flag in sync when a task is dropped on/out of the Completed column', async () => {
    render(<TaskKanbanBoard />);
    await act(async () => {
      await dnd.onDragEnd({ draggableId: 't1', source: { droppableId: 'pending', index: 0 }, destination: { droppableId: 'completed', index: 0 } });
    });
    expect(api.taskUpdate).toHaveBeenCalledWith('t1', expect.objectContaining({ status: 'completed', completed: true }));
    api.taskUpdate.mockClear();
    await act(async () => {
      await dnd.onDragEnd({ draggableId: 't3', source: { droppableId: 'completed', index: 0 }, destination: { droppableId: 'pending', index: 0 } });
    });
    expect(api.taskUpdate).toHaveBeenCalledWith('t3', expect.objectContaining({ status: 'pending', completed: false }));
  });

  it('does not wipe the board with a global loading state while a task is being moved', async () => {
    let resolve!: (v: Task) => void;
    api.taskUpdate.mockImplementation(() => new Promise((r) => (resolve = r)));
    render(<TaskKanbanBoard />);
    act(() => {
      void dnd.onDragEnd({ draggableId: 't1', source: { droppableId: 'pending', index: 0 }, destination: { droppableId: 'in-progress', index: 0 } });
    });
    expect(useTaskStore.getState().isLoading).toBe(false);
    expect(screen.getByText('Write proposal')).toBeInTheDocument();
    await act(async () => resolve(task({ status: 'in-progress' })));
  });

  it('filters by search text', async () => {
    render(<TaskKanbanBoard />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'release' } });
    await waitFor(() => expect(screen.queryByText('Write proposal')).toBeNull());
    expect(screen.getByText('Ship release')).toBeInTheDocument();
  });

  it('opens a task in the details modal when its card is clicked', async () => {
    render(<TaskKanbanBoard />);
    fireEvent.click(screen.getByText('Write proposal'));
    expect(await screen.findByText('Task Details')).toBeInTheDocument();
  });
});

describe('TaskDetailsModal', () => {
  it('creates a task with the entered fields', async () => {
    const onClose = vi.fn();
    render(<TaskDetailsModal task={null} isOpen onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText('Enter task title...'), { target: { value: 'Call Ada' } });
    fireEvent.change(screen.getByPlaceholderText('Describe your task...'), { target: { value: 'About the renewal' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(api.taskCreate).toHaveBeenCalledTimes(1));
    expect(api.taskCreate.mock.calls[0][0]).toMatchObject({ title: 'Call Ada', description: 'About the renewal', status: 'pending', priority: 'medium' });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('creates a task with tags and subtasks', async () => {
    render(<TaskDetailsModal task={null} isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Enter task title...'), { target: { value: 'Plan launch' } });
    fireEvent.change(screen.getByPlaceholderText('Add a tag...'), { target: { value: 'launch' } });
    fireEvent.keyPress(screen.getByPlaceholderText('Add a tag...'), { key: 'Enter', code: 'Enter', charCode: 13 });
    fireEvent.change(screen.getByPlaceholderText('Add a subtask...'), { target: { value: 'Draft copy' } });
    fireEvent.keyPress(screen.getByPlaceholderText('Add a subtask...'), { key: 'Enter', code: 'Enter', charCode: 13 });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(api.taskCreate).toHaveBeenCalled());
    const sent = api.taskCreate.mock.calls[0][0];
    expect(sent.tags).toContain('launch');
    expect(sent.subtasks.map((s: any) => s.title)).toEqual(['Draft copy']);
  });

  it('links a new task to a contact', async () => {
    useContactStore.setState({
      contacts: { c1: { id: 'c1', name: 'Ada Lovelace', firstName: 'Ada', lastName: 'Lovelace', email: 'a@x.io' } as any }
    });
    render(<TaskDetailsModal task={null} isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Enter task title...'), { target: { value: 'Follow up' } });
    fireEvent.change(screen.getByLabelText('Related record'), { target: { value: 'contact:c1' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(api.taskCreate).toHaveBeenCalled());
    expect(api.taskCreate.mock.calls[0][0].relatedTo).toEqual({ type: 'contact', id: 'c1', name: 'Ada Lovelace' });
  });

  it('pre-links a task created from a record widget', async () => {
    render(<TaskDetailsModal task={null} isOpen onClose={vi.fn()} defaultRelatedTo={{ type: 'deal', id: 'd1', name: 'TechCorp' }} />);
    fireEvent.change(screen.getByPlaceholderText('Enter task title...'), { target: { value: 'Send quote' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(api.taskCreate).toHaveBeenCalled());
    expect(api.taskCreate.mock.calls[0][0].relatedTo).toEqual({ type: 'deal', id: 'd1', name: 'TechCorp' });
  });

  it('shows an existing task read-only, then edits and saves it', async () => {
    const existing = useTaskStore.getState().tasks.t1;
    const onClose = vi.fn();
    render(<TaskDetailsModal task={existing} isOpen onClose={onClose} />);
    expect(screen.getByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Write proposal')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button').find((b) => /edit/i.test(b.textContent ?? ''))!);
    fireEvent.change(await screen.findByPlaceholderText('Enter task title...'), { target: { value: 'Write final proposal' } });
    fireEvent.click(screen.getByRole('button', { name: /update task/i }));
    await waitFor(() => expect(api.taskUpdate).toHaveBeenCalledWith('t1', expect.objectContaining({ title: 'Write final proposal' })));
  });

  it('deletes a task after confirmation and not when cancelled', async () => {
    const existing = useTaskStore.getState().tasks.t1;
    const onClose = vi.fn();
    render(<TaskDetailsModal task={existing} isOpen onClose={onClose} />);
    const del = () => screen.getAllByRole('button').find((b) => /delete/i.test(b.textContent ?? '') || b.querySelector('svg.lucide-trash-2'))!;
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    fireEvent.click(del());
    expect(api.taskDelete).not.toHaveBeenCalled();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    fireEvent.click(del());
    await waitFor(() => expect(api.taskDelete).toHaveBeenCalledWith('t1'));
  });

  it('the linked event shown for a contact comes from the record\'s linked events (not an event with the contact id)', async () => {
    api.timeline.mockResolvedValue({
      totalNumberOfCalendarEvents: 1,
      timelineCalendarEvents: [{ id: 'e9', title: 'Renewal call', isFullDay: false, startsAt: '2030-03-01T10:00:00Z', visibility: 'SHARE_EVERYTHING', conferenceLink: { primaryLinkLabel: 'Video call', primaryLinkUrl: 'https://v.example/x' }, participants: [] }]
    });
    const linked = task({ id: 'tl', relatedTo: { type: 'contact', id: 'c1', name: 'Ada' } });
    useTaskStore.setState({ tasks: { tl: linked } });
    render(<TaskDetailsModal task={linked} isOpen onClose={vi.fn()} />);
    expect(await screen.findByText('Renewal call')).toBeInTheDocument();
    expect(api.timeline).toHaveBeenCalledWith('contact', 'c1', 1, 0);
  });
});
