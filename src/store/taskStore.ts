import { create } from 'zustand';
import { Task, CalendarEvent, Activity, TaskFilters, Appointment } from '../types';
import { taskApi, activityApi } from '../services/api';
import { generateId } from '../utils';

interface TaskState {
  tasks: Record<string, Task>;
  calendarEvents: CalendarEvent[];
  activities: Activity[];
  appointments: Record<string, Appointment>;
  selectedTask: string | null;
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  createTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  markTaskComplete: (id: string, completed: boolean) => void;
  selectTask: (id: string | null) => void;
  loadTasks: () => Promise<void>;
  getFilteredTasks: () => Task[];
  setFilters: (filters: Partial<TaskFilters>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void;
  setSelectedTask: (task: Task | null) => void;
  loadInitialData: () => Promise<void>;
}

type TaskStore = TaskState & TaskActions;

// Sample task data for demonstration
const sampleTasks: Record<string, Task> = {
  '1': {
    id: '1',
    title: 'Review quarterly reports',
    description: 'Analyze Q3 performance metrics and prepare presentation for stakeholders.',
    dueDate: new Date(2024, 11, 25, 14, 30),
    priority: 'high',
    status: 'pending',
    category: 'meeting',
    type: 'meeting',
    completed: false,
    createdAt: new Date(2024, 11, 20),
    tags: ['quarterly', 'review'],
    attachments: [],
    subtasks: [],
  },
  '2': {
    id: '2',
    title: 'Follow up with client',
    description: 'Check on implementation progress and gather feedback.',
    dueDate: new Date(2024, 11, 24, 10, 0),
    priority: 'medium',
    status: 'in-progress',
    category: 'call',
    type: 'call',
    completed: false,
    createdAt: new Date(2024, 11, 22),
    tags: ['client', 'follow-up'],
    attachments: [],
    subtasks: [],
  },
  '3': {
    id: '3',
    title: 'Send proposal draft',
    description: 'Complete and send the revised project proposal to the client.',
    dueDate: new Date(2024, 11, 23, 16, 0),
    priority: 'high',
    status: 'completed',
    category: 'email',
    type: 'email',
    completed: true,
    createdAt: new Date(2024, 11, 21),
    completedAt: new Date(2024, 11, 23, 15, 30),
    tags: ['proposal', 'client'],
    attachments: [],
    subtasks: [],
  },
  '4': {
    id: '4',
    title: 'Team standup meeting',
    description: 'Weekly team sync to discuss progress and blockers.',
    dueDate: new Date(2024, 11, 26, 9, 0),
    priority: 'medium',
    status: 'pending',
    category: 'meeting',
    type: 'meeting',
    completed: false,
    createdAt: new Date(2024, 11, 19),
    tags: ['team', 'standup'],
    attachments: [],
    subtasks: [],
  },
  '5': {
    id: '5',
    title: 'Update project documentation',
    description: 'Refresh README files and API documentation for the latest release.',
    dueDate: new Date(2024, 11, 27, 11, 0),
    priority: 'low',
    status: 'pending',
    category: 'other',
    type: 'other',
    completed: false,
    createdAt: new Date(2024, 11, 20),
    tags: ['documentation', 'project'],
    attachments: [],
    subtasks: [],
  },
};

// Sample calendar events
const sampleCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Product Demo',
    description: 'Demonstrate new features to potential client',
    startDate: new Date(2024, 11, 26, 14, 0),
    endDate: new Date(2024, 11, 26, 15, 0),
    isAllDay: false,
    location: 'Conference Room A',
    attendees: ['john@company.com', 'client@example.com'],
    calendarId: 'work',
    type: 'meeting',
    status: 'scheduled',
  },
];

// Sample activities
const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'task_created',
    title: 'Task Created: Review quarterly reports',
    description: 'New task assigned for quarterly review',
    userId: 'user1',
    userName: 'John Doe',
    entityType: 'task',
    entityId: '1',
    createdAt: new Date(2024, 11, 20),
  },
  {
    id: '2',
    type: 'task_completed',
    title: 'Task Completed: Send proposal draft',
    description: 'Proposal draft has been completed and sent',
    userId: 'user1',
    userName: 'John Doe',
    entityType: 'task',
    entityId: '3',
    createdAt: new Date(2024, 11, 23, 15, 30),
  },
];

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  calendarEvents: [],
  activities: [],
  appointments: {},
  selectedTask: null,
  filters: {},
  isLoading: false,
  error: null,

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await taskApi.create({
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

      set((state) => ({
        tasks: { ...state.tasks, [newTask.id]: newTask },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to create task:', error);
      set({ error: 'Failed to create task', isLoading: false });
    }
  },

  updateTask: async (id, taskData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await taskApi.update(id, taskData);
      set((state) => ({
        tasks: { ...state.tasks, [id]: updatedTask },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: 'Failed to update task', isLoading: false });
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await taskApi.delete(id);
      set((state) => {
        const { [id]: deleted, ...remainingTasks } = state.tasks;
        return {
          tasks: remainingTasks,
          selectedTask: state.selectedTask === id ? null : state.selectedTask,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: 'Failed to delete task', isLoading: false });
    }
  },

  markTaskComplete: (id, completed) => {
    const currentTask = get().tasks[id];
    if (!currentTask) return;

    const updatedTask: Task = {
      ...currentTask,
      completed,
      status: completed ? 'completed' : 'pending',
      completedAt: completed ? new Date() : undefined,
    };

    set((state) => ({
      tasks: { ...state.tasks, [id]: updatedTask },
    }));
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

  loadInitialData: async () => {
    const state = get();
    if (Object.keys(state.tasks).length === 0) {
      await state.loadTasks();
    }
  },
}));