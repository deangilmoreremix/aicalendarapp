import { create } from 'zustand';
import { Task, TaskUpdate, CalendarEvent, Activity, TaskFilters, Appointment } from '../types';
import { taskApi, calendarEventApi, storedEventId } from '../services/api';
import { generateId } from '../utils';

interface TaskState {
  tasks: Record<string, Task>;
  calendarEvents: CalendarEvent[];
  /** The range `calendarEvents` was last loaded for successfully (null before the first load). */
  calendarEventsRange: { from: Date; to: Date } | null;
  activities: Activity[];
  appointments: Record<string, Appointment>;
  selectedTask: string | null;
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  createTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (id: string, taskData: TaskUpdate) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  markTaskComplete: (id: string, completed: boolean) => void;
  selectTask: (id: string | null) => void;
  loadTasks: () => Promise<void>;
  getFilteredTasks: () => Task[];
  setFilters: (filters: Partial<TaskFilters>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void;
  setSelectedTask: (task: Task | null) => void;
  loadInitialData: () => Promise<void>;
  /** Optimistic update used by calendar drag/reschedule (no global loading flag, rolls back on failure). */
  rescheduleTask: (id: string, taskData: TaskUpdate) => Promise<boolean>;
  loadCalendarEvents: (from: Date, to: Date) => Promise<void>;
  /** Re-load the range that was last requested (e.g. after an event was created elsewhere). */
  reloadCalendarEvents: () => Promise<void>;
  rescheduleCalendarEvent: (id: string, updates: { startDate?: Date; endDate?: Date; position?: number }) => Promise<boolean>;
  removeCalendarEvent: (id: string) => Promise<boolean>;
  /** Update one loaded event in place (used after an edit saved elsewhere). */
  patchCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
}

type TaskStore = TaskState & TaskActions;


/** Local copy of a task after a patch; `null` (clear this value) becomes `undefined` on the in-memory task. */
// Saves of the same task run one after another (a later save can never be overtaken by an earlier one, and each save's
// rollback starts from the state right before it). The counters let a Realtime refresh notice that a save overlapped it.
const taskSaveQueue = new Map<string, Promise<unknown>>();
let pendingTaskWrites = 0;
let taskWriteEpoch = 0;
export const getTaskWriteEpoch = () => taskWriteEpoch;
/** True when no task save started or finished since `epoch` and none is running. */
const taskWriteWaiters: (() => void)[] = [];
/** Resolves when no task save is running (a failed save counts as finished too). */
export const waitForTaskWrites = (): Promise<void> =>
  pendingTaskWrites === 0 ? Promise.resolve() : new Promise((resolve) => { taskWriteWaiters.push(resolve); });
export const taskWritesSettledSince = (epoch: number) => pendingTaskWrites === 0 && taskWriteEpoch === epoch;

const finishTaskWrite = () => {
  pendingTaskWrites -= 1;
  taskWriteEpoch += 1;
  if (pendingTaskWrites === 0) taskWriteWaiters.splice(0).forEach((resolve) => resolve());
};

/**
 * Counts a write that is not queued per task (creating a task) as pending from before its request until after its
 * result is in the store, so a Realtime read that overlaps it is not applied.
 */
const trackTaskWrite = async <T>(run: () => Promise<T>): Promise<T> => {
  pendingTaskWrites += 1;
  taskWriteEpoch += 1;
  try {
    return await run();
  } finally {
    finishTaskWrite();
  }
};

/**
 * Runs `run` after any earlier save of the same task has finished (saves of other tasks don't wait) and counts it as a
 * pending write while it is queued or running. With nothing in flight it starts at once.
 */
const enqueueTaskSave = <T>(id: string, run: () => Promise<T>): Promise<T> => {
  pendingTaskWrites += 1;
  taskWriteEpoch += 1;
  const earlier = taskSaveQueue.get(id);
  const result = earlier ? earlier.then(run, run) : run();
  taskSaveQueue.set(id, result);
  return result.finally(() => {
    finishTaskWrite();
    if (taskSaveQueue.get(id) === result) taskSaveQueue.delete(id);
  });
};

const applyTaskUpdate = (task: Task, update: TaskUpdate): Task => {
  const { completedAt, relatedTo, ...rest } = update;
  const next: Task = { ...task, ...rest };
  if (completedAt !== undefined) next.completedAt = completedAt ?? undefined;
  if (relatedTo !== undefined) next.relatedTo = relatedTo ?? undefined;
  return next;
};

// only the latest range request may write the store: navigating quickly must not let an older response win
let latestCalendarRangeRequest = 0;
/** Counts successful range loads: an optimistic edit's rollback is dropped if a newer load has replaced the events. */
let calendarLoadGeneration = 0;
let lastCalendarRange: { from: Date; to: Date } | null = null;

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  calendarEvents: [],
  calendarEventsRange: null,
  activities: [],
  appointments: {},
  selectedTask: null,
  filters: {},
  isLoading: false,
  error: null,

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      await trackTaskWrite(async () => {
        const created = await taskApi.create({
        title: taskData.title || '',
        description: taskData.description || '',
        dueDate: taskData.dueDate,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        category: taskData.category || 'other',
        type: taskData.type || 'other',
        completed: taskData.completed || false,
        tags: taskData.tags || [],
        attachments: [],
        subtasks: [],
        ...taskData,
        });
        // the new task is in the store before the write counts as finished
        set((state) => ({ tasks: { ...state.tasks, [created.id]: created } }));
        return created;
      });
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to create task:', error);
      set({ error: 'Failed to create task', isLoading: false });
    }
  },

  updateTask: async (id, taskData) => {
    set({ isLoading: true, error: null });
    try {
      // after any earlier save of the same task, so the requests reach the server in order
      // the saved task goes into the store INSIDE the queued step, so a save queued behind this one starts from it
      await enqueueTaskSave(id, async () => {
        const updatedTask = await taskApi.update(id, taskData);
        set((state) => ({
          tasks: { ...state.tasks, [id]: updatedTask },
          isLoading: false,
        }));
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: 'Failed to update task', isLoading: false });
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // after any earlier save of the same task settled, so a failing completion can't bring the task back afterwards
      await enqueueTaskSave(id, async () => {
        await taskApi.delete(id);
        set((state) => {
          const { [id]: deleted, ...remainingTasks } = state.tasks;
          return {
            tasks: remainingTasks,
            selectedTask: state.selectedTask === id ? null : state.selectedTask,
            isLoading: false,
          };
        });
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: 'Failed to delete task', isLoading: false });
    }
  },

  markTaskComplete: (id, completed) => {
    const currentTask = get().tasks[id];
    if (!currentTask) return;

    // saved like any other change (optimistic, rolled back if saving fails): a local-only change would be lost
    // the next time the tasks are refreshed from the database
    void get().rescheduleTask(id, {
      completed,
      status: completed ? 'completed' : 'pending',
      completedAt: completed ? new Date() : null,
    });
  },

  selectTask: (id) => {
    set({ selectedTask: id });
  },

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskApi.getAll();
      const tasksMap = tasks.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
      }, {} as Record<string, Task>);

      set({
        tasks: tasksMap,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ error: 'Failed to load tasks', isLoading: false });
    }
  },

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    let filteredTasks = Object.values(tasks);

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term)
      );
    }

    if (filters.priorities?.length) {
      filteredTasks = filteredTasks.filter(task =>
        filters.priorities!.includes(task.priority)
      );
    }

    if (filters.statuses?.length) {
      filteredTasks = filteredTasks.filter(task =>
        filters.statuses!.includes(task.status)
      );
    }

    if (filters.assigneeIds?.length) {
      filteredTasks = filteredTasks.filter(task =>
        task.assignedUserId !== undefined && filters.assigneeIds!.includes(task.assignedUserId)
      );
    }

    if (filters.dueDateRange?.start || filters.dueDateRange?.end) {
      const { start, end } = filters.dueDateRange;
      filteredTasks = filteredTasks.filter(task => {
        const when = task.dueDate ?? task.startTime;
        if (!when) return false;
        return (!start || when >= start) && (!end || when <= end);
      });
    }

    if (filters.isOverdue) {
      filteredTasks = filteredTasks.filter(task =>
        task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
      );
    }

    if (filters.isDueToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filteredTasks = filteredTasks.filter(task =>
        task.dueDate && task.dueDate >= today && task.dueDate < tomorrow
      );
    }

    return filteredTasks;
  },

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  addActivity: (activityData) => {
    const activity: Activity = {
      ...activityData,
      id: generateId(),
      createdAt: new Date(),
    };

    set(state => ({
      activities: [activity, ...state.activities]
    }));
  },

  setSelectedTask: (task) => {
    set({ selectedTask: task?.id || null });
  },

  rescheduleTask: (id, taskData) => {
    if (!get().tasks[id]) return Promise.resolve(false);
    return enqueueTaskSave(id, async (): Promise<boolean> => {
      // the baseline is taken when this save starts, after earlier saves of the same task have finished
      const previous = get().tasks[id];
      if (!previous) return false;
      set((state) => ({ tasks: { ...state.tasks, [id]: applyTaskUpdate(previous, taskData) } }));
      try {
        const saved = await taskApi.update(id, taskData);
        set((state) => ({ tasks: { ...state.tasks, [id]: saved } }));
        return true;
      } catch (error) {
        console.error('Failed to reschedule task:', error);
        set((state) => ({ tasks: { ...state.tasks, [id]: previous }, error: 'Failed to reschedule task' }));
        return false;
      }
    });
  },

  loadCalendarEvents: async (from, to) => {
    lastCalendarRange = { from, to };
    const request = ++latestCalendarRangeRequest;
    try {
      const events = await calendarEventApi.getRange(from, to);
      if (request === latestCalendarRangeRequest) {
        calendarLoadGeneration += 1;
        set({ calendarEvents: events, calendarEventsRange: { from, to } });
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      if (request === latestCalendarRangeRequest) set({ error: 'Failed to load calendar events' });
    }
  },

  reloadCalendarEvents: async () => {
    if (lastCalendarRange) await get().loadCalendarEvents(lastCalendarRange.from, lastCalendarRange.to);
  },

  rescheduleCalendarEvent: async (id, updates) => {
    const previous = get().calendarEvents;
    const generation = calendarLoadGeneration;
    set({ calendarEvents: previous.map(e => (e.id === id ? { ...e, ...updates } : e)) });
    try {
      await calendarEventApi.update(storedEventId(id), updates);
      return true;
    } catch (error) {
      console.error('Failed to reschedule event:', error);
      set(calendarLoadGeneration === generation ? { calendarEvents: previous, error: 'Failed to reschedule event' } : { error: 'Failed to reschedule event' });
      return false;
    }
  },

  patchCalendarEvent: (id, updates) => {
    // an edit of a repeating event changes the whole series, so the occurrences are worked out again
    if (id.includes('#') || updates.recurrenceRule || get().calendarEvents.some((e) => e.id === id && e.recurrenceRule)) {
      void get().reloadCalendarEvents();
      return;
    }
    set((state) => ({ calendarEvents: state.calendarEvents.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
  },

  removeCalendarEvent: async (id) => {
    const previous = get().calendarEvents;
    const stored = storedEventId(id);
    const generation = calendarLoadGeneration;
    // deleting an occurrence deletes the whole series (single-occurrence exceptions are not supported)
    set({ calendarEvents: previous.filter(e => e.id !== id && e.id !== stored && e.seriesId !== stored) });
    try {
      await calendarEventApi.delete(stored);
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      set(calendarLoadGeneration === generation ? { calendarEvents: previous, error: 'Failed to delete event' } : { error: 'Failed to delete event' });
      return false;
    }
  },

  loadInitialData: async () => {
    const state = get();
    if (Object.keys(state.tasks).length === 0) {
      await state.loadTasks();
    }
  },
}));