import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskStats from '../../components/TaskStats'
import { useTaskStore } from '../../store/taskStore'
import { Task } from '../../types'

// Mock the task store
vi.mock('../../store/taskStore', () => ({
  useTaskStore: vi.fn(),
}))

const mockUseTaskStore = vi.mocked(useTaskStore)

describe('Task Management Workflow Integration', () => {
  let mockTasks: Record<string, Task>
  let mockStore: any

  beforeEach(() => {
    // Initialize mock data
    mockTasks = {
      'task-1': {
        id: 'task-1',
        title: 'Review quarterly reports',
        description: 'Analyze Q3 performance metrics',
        dueDate: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(12, 0, 0, 0); // Noon tomorrow
          return tomorrow;
        })(),
        priority: 'high',
        status: 'pending',
        category: 'meeting',
        type: 'meeting',
        completed: false,
        createdAt: new Date(),
        tags: ['quarterly', 'review'],
        attachments: [],
        subtasks: [],
      },
      'task-2': {
        id: 'task-2',
        title: 'Follow up with client',
        description: 'Check on implementation progress',
        dueDate: (() => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(12, 0, 0, 0); // Noon yesterday
          return yesterday;
        })(),
        priority: 'medium',
        status: 'pending',
        category: 'call',
        type: 'call',
        completed: false,
        createdAt: new Date(),
        tags: ['client', 'follow-up'],
        attachments: [],
        subtasks: [],
      },
    }

    mockStore = {
      tasks: mockTasks,
      markTaskComplete: vi.fn(),
      updateTask: vi.fn(),
      createTask: vi.fn(),
      deleteTask: vi.fn(),
    }

    mockUseTaskStore.mockReturnValue(mockStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render task statistics component', () => {
    render(<TaskStats />)

    // Check that main elements are present
    expect(screen.getByText('Total Tasks')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Due Today')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('should display correct total task count', () => {
    render(<TaskStats />)

    // Should show 2 total tasks
    const totalElement = screen.getByText('Total Tasks').nextElementSibling
    expect(totalElement).toHaveTextContent('2')
  })

  it('should handle task completion updates', () => {
    // Mark one task as completed
    mockTasks['task-1'].completed = true
    mockTasks['task-1'].status = 'completed'
    mockTasks['task-1'].completedAt = new Date()

    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      tasks: mockTasks,
    })

    render(<TaskStats />)

    // Should show 1 completed task
    const completedElement = screen.getByText('Completed').nextElementSibling
    expect(completedElement).toHaveTextContent('1')

    // Should show 50% completion rate
    expect(screen.getByText('50% complete')).toBeInTheDocument()
  })

  it('should handle overdue tasks correctly', () => {
    render(<TaskStats />)

    // Should show 1 overdue task
    const overdueElement = screen.getByText('Overdue').nextElementSibling
    expect(overdueElement).toHaveTextContent('1')
  })

  it('should handle due today tasks correctly', () => {
    render(<TaskStats />)

    // Should show 0 due today tasks (task-1 is due tomorrow, task-2 is overdue)
    const dueTodayElement = screen.getByText('Due Today').nextElementSibling
    expect(dueTodayElement).toHaveTextContent('0')
  })

  it('should handle empty task list', () => {
    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      tasks: {},
    })

    render(<TaskStats />)

    // Should show 0% completion rate
    expect(screen.getByText('0% complete')).toBeInTheDocument()
  })

  it('should handle all tasks completed', () => {
    // Mark all tasks as completed
    Object.keys(mockTasks).forEach(taskId => {
      mockTasks[taskId].completed = true
      mockTasks[taskId].status = 'completed'
      mockTasks[taskId].completedAt = new Date()
    })

    mockUseTaskStore.mockReturnValue({
      ...mockStore,
      tasks: mockTasks,
    })

    render(<TaskStats />)

    // Should show 100% completion rate
    expect(screen.getByText('100% complete')).toBeInTheDocument()

    // Should show 0 overdue tasks
    const overdueElement = screen.getByText('Overdue').nextElementSibling
    expect(overdueElement).toHaveTextContent('0')
  })
})