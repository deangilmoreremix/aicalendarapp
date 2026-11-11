import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({
  taskUpdate: vi.fn(),
  taskCreate: vi.fn(),
  taskDelete: vi.fn(),
  dealUpdate: vi.fn(),
  contactUpdate: vi.fn(),
  getRange: vi.fn(),
  eventUpdate: vi.fn(),
  eventDelete: vi.fn(),
  viewsGetAll: vi.fn(),
  viewsCreate: vi.fn(),
  viewsDelete: vi.fn(),
  timeline: vi.fn()
}));

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api')>();
  return {
    ...actual,
    taskApi: { ...actual.taskApi, getAll: vi.fn().mockResolvedValue([]), update: api.taskUpdate, create: api.taskCreate, delete: api.taskDelete },
    dealApi: { ...actual.dealApi, getAll: vi.fn().mockResolvedValue([]), update: api.dealUpdate },
    contactApi: { ...actual.contactApi, getAll: vi.fn().mockResolvedValue([]), update: api.contactUpdate },
    activityApi: { ...actual.activityApi, getAll: vi.fn().mockResolvedValue([]) },
    calendarEventApi: {
      ...actual.calendarEventApi,
      getRange: api.getRange,
      update: api.eventUpdate,
      delete: api.eventDelete,
      getTimeline: api.timeline
    },
    calendarViewApi: { getAll: api.viewsGetAll, create: api.viewsCreate, delete: api.viewsDelete, update: vi.fn() }
  };
});

// The task modal embeds the AI assistant; a stable mock (a fresh object per render would loop effects that depend on it)
vi.mock('../../contexts/AIContext', () => {
  const ai = { generateTaskSuggestions: vi.fn(async () => []), generateInsights: vi.fn(async () => []), predictNextBestAction: vi.fn(async () => ''), isProcessing: false };
  return { useAI: () => ai, AIProvider: ({ children }: any) => <>{children}</> };
});

// Capture the props BigTaskCalendar passes to the drag-and-drop calendar so drops can be simulated (jsdom cannot drag)
const dnd = vi.hoisted(() => ({ props: null as any }));
vi.mock('react-big-calendar/lib/addons/dragAndDrop', () => ({
  default: (Cal: any) => (props: any) => {
    dnd.props = props;
    return <Cal {...props} />;
  }
}));

import { BigTaskCalendar } from '../BigTaskCalendar';
import { RecordContextMenu } from './RecordContextMenu';
import { CalendarFiltersMenu } from './CalendarFiltersMenu';
import { CalendarViewsMenu } from './CalendarViewsMenu';
import { RecordTasksWidget } from './RecordTasksWidget';
import { applyRescheduleUpdates, deleteRecord, duplicateRecord } from './recordCalendarActions';
import { buildUnifiedRecords } from './unifiedCalendarRecords';
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { useCalendarSelectionStore } from '../../store/calendarSelectionStore';
import type { CalendarEvent, Contact, Deal, Task } from '../../types';

const noon = (daysFromToday: number) => {
  const d = new Date();
  d.setDate(15 + daysFromToday);
  d.setHours(12, 0, 0, 0);
  return d;
};
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Send proposal',
  priority: 'high',
  status: 'pending',
  category: 'other',
  type: 'other',
  completed: false,
  createdAt: new Date(),
  tags: [],
  attachments: [],
  subtasks: [],
  dueDate: noon(0),
  ...over
});
const deal = (over: Partial<Deal> = {}): Deal => ({
  id: 'd1',
  company: 'TechCorp',
  value: '$85,000',
  probability: '85',
  dueDate: ymd(noon(1)),
  contactId: 'c1',
  status: 'online',
  stage: 'negotiation',
  priority: 'high',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over
});
const contact = (over: Partial<Contact> = {}): Contact => ({
  id: 'c1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  name: 'Ada Lovelace',
  email: 'ada@x.io',
  title: 'CTO',
  company: 'Analytical',
  sources: [],
  interestLevel: 'hot',
  status: 'lead',
  tags: [],
  socialProfiles: {},
  customFields: {},
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  nextFollowUp: ymd(noon(2)),
  ...over
});
const event = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'e1',
  title: 'Kickoff',
  startDate: noon(3),
  endDate: new Date(noon(3).getTime() + 3600_000),
  isAllDay: false,
  calendarId: 'default',
  type: 'event',
  status: 'scheduled',
  ...over
});

const seedStores = () => {
  useTaskStore.setState({ tasks: { t1: task() }, calendarEvents: [event()], error: null });
  useDealStore.setState({ deals: { d1: deal() }, error: null });
  useContactStore.setState({ contacts: { c1: contact() }, error: null });
  useCalendarSelectionStore.setState({ selectedKeys: [] });
};

beforeEach(() => {
  vi.clearAllMocks();
  api.taskUpdate.mockImplementation(async (id: string, updates: Partial<Task>) => ({ ...useTaskStore.getState().tasks[id], ...updates }));
  api.dealUpdate.mockImplementation(async (id: string, updates: Partial<Deal>) => ({ ...useDealStore.getState().deals[id], ...updates }));
  api.contactUpdate.mockImplementation(async (id: string, updates: Partial<Contact>) => ({ ...useContactStore.getState().contacts[id], ...updates }));
  api.taskCreate.mockImplementation(async (t: Partial<Task>) => ({ ...task(), ...t, id: 'new-task' }));
  api.getRange.mockResolvedValue([event()]);
  api.eventUpdate.mockResolvedValue(event());
  api.eventDelete.mockResolvedValue(undefined);
  api.taskDelete.mockResolvedValue(undefined);
  api.viewsGetAll.mockResolvedValue([]);
  api.timeline.mockResolvedValue({ timelineCalendarEvents: [], totalNumberOfCalendarEvents: 0 });
  seedStores();
});

describe('record calendar actions', () => {
  const rec = (type: 'task' | 'deal' | 'contact' | 'event') =>
    buildUnifiedRecords({
      tasks: Object.values(useTaskStore.getState().tasks),
      deals: Object.values(useDealStore.getState().deals),
      contacts: Object.values(useContactStore.getState().contacts),
      events: useTaskStore.getState().calendarEvents
    }).find((r) => r.type === type)!;

  it('persists a task reschedule optimistically and keeps the saved task', async () => {
    const record = rec('task');
    const newDue = new Date(noon(4));
    const promise = applyRescheduleUpdates(record, { task: { dueDate: newDue } });
    expect(useTaskStore.getState().tasks.t1.dueDate).toEqual(newDue); // optimistic
    expect(await promise).toBe(true);
    expect(api.taskUpdate).toHaveBeenCalledWith('t1', { dueDate: newDue });
  });

  it('rolls a task back when saving fails', async () => {
    api.taskUpdate.mockRejectedValue(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = useTaskStore.getState().tasks.t1.dueDate;
    expect(await applyRescheduleUpdates(rec('task'), { task: { dueDate: noon(9) } })).toBe(false);
    expect(useTaskStore.getState().tasks.t1.dueDate).toEqual(before);
  });

  it('persists deal due date and contact follow-up', async () => {
    expect(await applyRescheduleUpdates(rec('deal'), { deal: { dueDate: '2031-01-02' } })).toBe(true);
    expect(api.dealUpdate).toHaveBeenCalledWith('d1', { dueDate: '2031-01-02' });
    expect(await applyRescheduleUpdates(rec('contact'), { contact: { nextFollowUp: '2031-01-03' } })).toBe(true);
    expect(api.contactUpdate).toHaveBeenCalledWith('c1', { nextFollowUp: '2031-01-03' });
  });

  it('persists an event move and rolls back on failure', async () => {
    const start = noon(5);
    expect(await applyRescheduleUpdates(rec('event'), { event: { startDate: start, endDate: start } })).toBe(true);
    expect(api.eventUpdate).toHaveBeenCalledWith('e1', { startDate: start, endDate: start });

    api.eventUpdate.mockRejectedValue(new Error('nope'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = useTaskStore.getState().calendarEvents[0].startDate;
    expect(await applyRescheduleUpdates(rec('event'), { event: { startDate: noon(8) } })).toBe(false);
    expect(useTaskStore.getState().calendarEvents[0].startDate).toEqual(before);
  });

  it('duplicates a task as an open copy and deletes records', async () => {
    expect(await duplicateRecord(rec('task'))).toBe(true);
    expect(api.taskCreate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Send proposal (copy)', status: 'pending', completed: false }));
    expect(await duplicateRecord(rec('contact'))).toBe(false);

    expect(await deleteRecord(rec('task'))).toBe(true);
    expect(api.taskDelete).toHaveBeenCalledWith('t1');
    expect(await deleteRecord(rec('event'))).toBe(true);
    expect(api.eventDelete).toHaveBeenCalledWith('e1');
  });

  it('"deleting" a contact from the calendar only clears the follow-up', async () => {
    expect(await deleteRecord(rec('contact'))).toBe(true);
    expect(api.contactUpdate).toHaveBeenCalledWith('c1', { nextFollowUp: null });
  });
});

describe('RecordContextMenu', () => {
  const record = buildUnifiedRecords({ tasks: [task()], deals: [], contacts: [], events: [] })[0];

  it('offers edit, duplicate, reschedule and delete and reports the action', () => {
    const onAction = vi.fn();
    const onClose = vi.fn();
    render(<RecordContextMenu record={record} position={{ x: 10, y: 20 }} onAction={onAction} onClose={onClose} />);
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Edit', 'Duplicate', 'Reschedule to tomorrow', 'Reschedule +1 week', 'Delete']);
    fireEvent.click(screen.getByRole('menuitem', { name: /reschedule \+1 week/i }));
    expect(onAction).toHaveBeenCalledWith('nextWeek', record);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<RecordContextMenu record={record} position={{ x: 0, y: 0 }} onAction={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('contacts get "Clear follow-up" and no duplicate', () => {
    const contactRecord = buildUnifiedRecords({ tasks: [], deals: [], contacts: [contact()], events: [] })[0];
    render(<RecordContextMenu record={contactRecord} position={{ x: 0, y: 0 }} onAction={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('menuitem', { name: 'Clear follow-up' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Duplicate' })).toBeNull();
  });
});

describe('CalendarFiltersMenu', () => {
  it('toggles record types, statuses and the date field', () => {
    const onFiltersChange = vi.fn();
    const onVisibleTypesChange = vi.fn();
    const onFieldByTypeChange = vi.fn();
    render(
      <CalendarFiltersMenu
        filters={{}}
        onFiltersChange={onFiltersChange}
        visibleTypes={['task', 'deal', 'contact', 'event']}
        onVisibleTypesChange={onVisibleTypesChange}
        statusOptions={['pending', 'completed']}
        assigneeOptions={[{ id: 'u1', name: 'Sam' }]}
        fieldByType={{}}
        onFieldByTypeChange={onFieldByTypeChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /filter calendar/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Deals' }));
    expect(onVisibleTypesChange).toHaveBeenCalledWith(['task', 'contact', 'event']);
    fireEvent.click(screen.getByLabelText('completed'));
    expect(onFiltersChange).toHaveBeenCalledWith({ statuses: ['completed'] });
    fireEvent.click(screen.getByLabelText('Sam'));
    expect(onFiltersChange).toHaveBeenCalledWith({ assigneeIds: ['u1'] });
    fireEvent.change(screen.getByLabelText('Contacts date field'), { target: { value: 'createdAt' } });
    expect(onFieldByTypeChange).toHaveBeenCalledWith({ contact: 'createdAt' });
  });

  it('shows how many filters are active', () => {
    render(
      <CalendarFiltersMenu
        filters={{ statuses: ['pending'] }}
        onFiltersChange={vi.fn()}
        visibleTypes={['task']}
        onVisibleTypesChange={vi.fn()}
        statusOptions={[]}
        assigneeOptions={[]}
        fieldByType={{}}
        onFieldByTypeChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /filter calendar/i })).toHaveTextContent('Filters (4)');
  });
});

describe('CalendarViewsMenu (saved views)', () => {
  const current = { layout: 'WEEK' as const, fieldByType: { contact: 'createdAt' }, filters: { statuses: ['pending'] }, visibleTypes: ['task' as const] };

  it('saves the current calendar state as a named view', async () => {
    const saved = { id: 'v1', name: 'My week', position: 0, isDefault: false, ...current };
    api.viewsCreate.mockResolvedValue(saved);
    render(<CalendarViewsMenu current={current} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /saved views/i }));
    fireEvent.change(screen.getByLabelText('View name'), { target: { value: 'My week' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.viewsCreate).toHaveBeenCalledWith({ ...current, name: 'My week' }));
    expect(await screen.findByText('My week')).toBeInTheDocument();
  });

  it('applies and deletes saved views', async () => {
    const view = { id: 'v1', name: 'Deals only', position: 0, isDefault: false, layout: 'MONTH' as const, fieldByType: {}, filters: {}, visibleTypes: ['deal' as const] };
    api.viewsGetAll.mockResolvedValue([view]);
    api.viewsDelete.mockResolvedValue(undefined);
    const onApply = vi.fn();
    render(<CalendarViewsMenu current={current} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: /saved views/i }));
    fireEvent.click(await screen.findByText('Deals only'));
    expect(onApply).toHaveBeenCalledWith(view);
    fireEvent.click(screen.getByRole('button', { name: 'Delete view Deals only' }));
    await waitFor(() => expect(api.viewsDelete).toHaveBeenCalledWith('v1'));
    await waitFor(() => expect(screen.queryByText('Deals only')).toBeNull());
  });

  it('shows an error when saving fails', async () => {
    api.viewsCreate.mockRejectedValue(new Error('x'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CalendarViewsMenu current={current} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /saved views/i }));
    fireEvent.change(screen.getByLabelText('View name'), { target: { value: 'Broken' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Could not save the view.')).toBeInTheDocument();
  });
});

describe('RecordTasksWidget', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: {
        a: task({ id: 'a', title: 'Call Ada', relatedTo: { type: 'contact', id: 'c1', name: 'Ada' } }),
        b: task({ id: 'b', title: 'Send contract', status: 'completed', completed: true, relatedTo: { type: 'contact', id: 'c1', name: 'Ada' } }),
        c: task({ id: 'c', title: 'Other contact task', relatedTo: { type: 'contact', id: 'zzz', name: 'Z' } }),
        d: task({ id: 'd', title: 'Deal task', relatedTo: { type: 'deal', id: 'c1', name: 'D' } })
      }
    });
  });

  it('lists only the record\'s tasks, grouped by status', () => {
    render(<RecordTasksWidget targetType="contact" targetId="c1" targetName="Ada" />);
    expect(screen.getByText('Call Ada')).toBeInTheDocument();
    expect(screen.getByText('Send contract')).toBeInTheDocument();
    expect(screen.queryByText('Other contact task')).toBeNull();
    expect(screen.queryByText('Deal task')).toBeNull();
    const headings = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(headings[0]).toMatch(/^To Do/);
    expect(headings[1]).toMatch(/^Completed/);
  });

  it('completes a task with the checkbox', async () => {
    render(<RecordTasksWidget targetType="contact" targetId="c1" targetName="Ada" />);
    fireEvent.click(screen.getByLabelText('Complete Call Ada'));
    await waitFor(() => expect(api.taskUpdate).toHaveBeenCalledWith('a', expect.objectContaining({ status: 'completed', completed: true })));
  });

  it('shows the empty state', () => {
    render(<RecordTasksWidget targetType="contact" targetId="nobody" targetName="N" />);
    expect(screen.getByText('Mission accomplished!')).toBeInTheDocument();
  });
});

describe('BigTaskCalendar: unified CRM calendar', () => {
  it('shows tasks, deals, contacts and events together', async () => {
    render(<BigTaskCalendar />);
    expect(await screen.findByText('Send proposal')).toBeInTheDocument();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Kickoff')).toBeInTheDocument();
  });

  it('"Edit Task" from the event details opens the task straight in edit mode (no second Edit press)', async () => {
    render(<BigTaskCalendar />);
    fireEvent.click(await screen.findByText('Send proposal'));
    // event details dialog -> its "Edit Task" button hands over to the task modal
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Task' }));
    expect(await screen.findByLabelText('Related record')).toBeInTheDocument(); // the edit form, not the read-only view
    expect(screen.getByRole('button', { name: 'Update Task' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Task' })).toBeNull();
  });

  it('the context menu "Edit" also opens a task in edit mode', async () => {
    render(<BigTaskCalendar />);
    fireEvent.contextMenu(await screen.findByText('Send proposal'));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(await screen.findByLabelText('Related record')).toBeInTheDocument();
  });

  it('loads events for the visible window', async () => {
    render(<BigTaskCalendar />);
    await waitFor(() => expect(api.getRange).toHaveBeenCalled());
    const [from, to] = api.getRange.mock.calls[0];
    expect(from.getTime()).toBeLessThan(to.getTime());
  });

  it('hides a record type from the filters menu', async () => {
    render(<BigTaskCalendar />);
    await screen.findByText('TechCorp');
    fireEvent.click(screen.getByRole('button', { name: /filter calendar/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Deals' }));
    await waitFor(() => expect(screen.queryByText('TechCorp')).toBeNull());
    expect(screen.getByText('Send proposal')).toBeInTheDocument();
  });

  it('persists a drag of a deal to another day', async () => {
    render(<BigTaskCalendar />);
    await screen.findByText('TechCorp');
    const dealEvent = dnd.props.events.find((e: any) => e.resource.type === 'deal');
    const target = noon(6);
    await act(async () => {
      await dnd.props.onEventDrop({ event: dealEvent, start: target, end: target, isAllDay: true });
    });
    expect(api.dealUpdate).toHaveBeenCalledWith('d1', { dueDate: ymd(target) });
  });

  it('persists a drag of a contact follow-up and a task', async () => {
    render(<BigTaskCalendar />);
    await screen.findByText('Ada Lovelace');
    const contactEvent = dnd.props.events.find((e: any) => e.resource.type === 'contact');
    const taskEvent = dnd.props.events.find((e: any) => e.resource.type === 'task');
    const target = noon(7);
    await act(async () => {
      await dnd.props.onEventDrop({ event: contactEvent, start: target, end: target, isAllDay: true });
      await dnd.props.onEventDrop({ event: taskEvent, start: target, end: target, isAllDay: true });
    });
    expect(api.contactUpdate).toHaveBeenCalledWith('c1', { nextFollowUp: ymd(target) });
    expect(api.taskUpdate).toHaveBeenCalledWith('t1', expect.objectContaining({ dueDate: expect.any(Date) }));
  });

  it('shows an error when a drop cannot be saved', async () => {
    api.taskUpdate.mockRejectedValue(new Error('x'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<BigTaskCalendar />);
    await screen.findByText('Send proposal');
    const taskEvent = dnd.props.events.find((e: any) => e.resource.type === 'task');
    await act(async () => {
      await dnd.props.onEventDrop({ event: taskEvent, start: noon(5), end: noon(5), isAllDay: true });
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not move "Send proposal".');
  });

  it('right-click selects the record and opens its menu; reschedule to tomorrow saves', async () => {
    render(<BigTaskCalendar />);
    const card = (await screen.findByText('TechCorp')).closest('[data-record-type]')!;
    fireEvent.contextMenu(card);
    expect(useCalendarSelectionStore.getState().selectedKeys).toEqual(['deal:d1']);
    const menu = screen.getByRole('menu');
    fireEvent.click(within(menu).getByRole('menuitem', { name: /reschedule to tomorrow/i }));
    await waitFor(() => expect(api.dealUpdate).toHaveBeenCalledWith('d1', { dueDate: ymd(new Date(noon(1).getTime() + 86400_000)) }));
  });

  it('Escape clears the selection', async () => {
    render(<BigTaskCalendar />);
    await screen.findByText('Send proposal');
    act(() => useCalendarSelectionStore.getState().select('task:t1'));
    expect(useCalendarSelectionStore.getState().selectedKeys).toEqual(['task:t1']);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useCalendarSelectionStore.getState().selectedKeys).toEqual([]);
  });

  it('the Today button moves to today and Next moves by the current view unit', async () => {
    render(<BigTaskCalendar />);
    await screen.findByText('Send proposal');
    const title = () => screen.getByRole('heading', { level: 2 }).textContent;
    const initial = title();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(title()).not.toBe(initial);
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(title()).toBe(initial);
  });
});

describe('BigTaskCalendar toolbar', () => {
  it('titles the week view with the upstream week-range format', async () => {
    render(<BigTaskCalendar />);
    await screen.findByText('Send proposal');
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/^[A-Z][a-z]{2} \d{1,2} – (?:[A-Z][a-z]{2} )?\d{1,2}, \d{4}$/);
  });
});

describe('RecordContextMenu placement', () => {
  it('stays inside the viewport when opened near the right/bottom edge', () => {
    const record = buildUnifiedRecords({ tasks: [task()], deals: [], contacts: [], events: [] })[0];
    render(<RecordContextMenu record={record} position={{ x: window.innerWidth - 2, y: window.innerHeight - 2 }} onAction={vi.fn()} onClose={vi.fn()} />);
    const menu = screen.getByRole('menu');
    expect(parseInt(menu.style.left)).toBeLessThanOrEqual(window.innerWidth - 208);
    expect(parseInt(menu.style.top)).toBeLessThanOrEqual(window.innerHeight - 200);
  });
});
