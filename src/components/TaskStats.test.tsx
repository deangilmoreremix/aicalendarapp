import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskStats from './TaskStats'
import { useTaskStore } from '../store/taskStore'
import { Task } from '../types'

// Mock the task store
vi.mock('../store/taskStore', () => ({
  useTaskStore: vi.fn(),
}))

const mockUseTaskStore = vi.mocked(useTaskStore)

describe('TaskStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with empty tasks', () => {
    mockUseTaskStore.mockReturnValue({
      tasks: {},
    } as any)

    render(<TaskStats />)

    expect(screen.getByText('Total Tasks')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Due Today')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()

    // Check that all stat values are 0
    const statValues = screen.getAllByText('0')
    expect(statValues).toHaveLength(4)
  })

  it('calculates stats correctly with sample tasks', () => {
    const mockTasks: Record<string, Task> = {
      '1': {
        id: '1',
        title: 'Task 1',
        completed: false,
        status: 'pending',
        priority: 'medium',
        category: 'other',
        type: 'other',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      },
      '2': {
        id: '2',
        title: 'Task 2',
        completed: true,
        status: 'completed',
        priority: 'high',
        category: 'meeting',
        type: 'meeting',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
      },
      '3': {
        id: '3',
        title: 'Task 3',
        completed: false,
        status: 'pending',
        priority: 'low',
        category: 'call',
        type: 'call',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
    }

    mockUseTaskStore.mockReturnValue({
      tasks: mockTasks,
    } as any)

    render(<TaskStats />)

    // Total tasks: 3
    const totalTasksElement = screen.getByText('Total Tasks').nextElementSibling
    expect(totalTasksElement).toHaveTextContent('3')

    // Completed: 1
    const completedElement = screen.getByText('Completed').nextElementSibling
    expect(completedElement).toHaveTextContent('1')

    // Completion rate: 33%
    expect(screen.getByText('33% complete')).toBeInTheDocument()
  })

  it('displays correct overdue count', () => {
    const mockTasks: Record<string, Task> = {
      '1': {
        id: '1',
        title: 'Overdue Task',
        completed: false,
        status: 'pending',
        priority: 'high',
        category: 'meeting',
        type: 'meeting',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
      '2': {
        id: '2',
        title: 'Completed Overdue Task',
        completed: true,
        status: 'completed',
        priority: 'high',
        category: 'meeting',
        type: 'meeting',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
    }

    mockUseTaskStore.mockReturnValue({
      tasks: mockTasks,
    } as any)

    render(<TaskStats />)

    // Should show 1 overdue (completed overdue tasks don't count)
    const overdueElement = screen.getByText('Overdue').nextElementSibling
    expect(overdueElement).toHaveTextContent('1')
  })

  it('displays correct due today count', () => {
    const today = new Date()
    today.setHours(14, 0, 0, 0) // 2 PM today

    const mockTasks: Record<string, Task> = {
      '1': {
        id: '1',
        title: 'Due Today Task',
        completed: false,
        status: 'pending',
        priority: 'medium',
        category: 'call',
        type: 'call',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
        dueDate: today,
      },
      '2': {
        id: '2',
        title: 'Completed Due Today Task',
        completed: true,
        status: 'completed',
        priority: 'medium',
        category: 'call',
        type: 'call',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
        dueDate: today,
      },
    }

    mockUseTaskStore.mockReturnValue({
      tasks: mockTasks,
    } as any)

    render(<TaskStats />)

    // Should show 1 due today (completed tasks don't count)
    const dueTodayElement = screen.getByText('Due Today').nextElementSibling
    expect(dueTodayElement).toHaveTextContent('1')
  })

  it('renders all stat cards with correct structure', () => {
    mockUseTaskStore.mockReturnValue({
      tasks: {},
    } as any)

    render(<TaskStats />)

    // Check that all stat titles are present
    expect(screen.getByText('Total Tasks')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Due Today')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()

    // Check that all stat values are present (should be 0 for empty tasks)
    const statValues = screen.getAllByText('0')
    expect(statValues).toHaveLength(4) // Total, Completed, Due Today, Overdue
  })

  it('displays completion rate correctly', () => {
    const mockTasks: Record<string, Task> = {
      '1': {
        id: '1',
        title: 'Task 1',
        completed: true,
        status: 'completed',
        priority: 'medium',
        category: 'other',
        type: 'other',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
      },
      '2': {
        id: '2',
        title: 'Task 2',
        completed: true,
        status: 'completed',
        priority: 'medium',
        category: 'other',
        type: 'other',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
      },
    }

    mockUseTaskStore.mockReturnValue({
      tasks: mockTasks,
    } as any)

    render(<TaskStats />)

    // Should show 100% completion rate
    expect(screen.getByText('100% complete')).toBeInTheDocument()
  })

  it('handles tasks without due dates', () => {
    const mockTasks: Record<string, Task> = {
      '1': {
        id: '1',
        title: 'Task without due date',
        completed: false,
        status: 'pending',
        priority: 'medium',
        category: 'other',
        type: 'other',
        createdAt: new Date(),
        tags: [],
        attachments: [],
        subtasks: [],
        // No dueDate
      },
    }

    mockUseTaskStore.mockReturnValue({
      tasks: mockTasks,
    } as any)

    render(<TaskStats />)

    // Should not count as overdue or due today
    const dueTodayElement = screen.getByText('Due Today').nextElementSibling
    const overdueElement = screen.getByText('Overdue').nextElementSibling
    expect(dueTodayElement).toHaveTextContent('0')
    expect(overdueElement).toHaveTextContent('0')
  })

  it('renders with proper CSS classes', () => {
    mockUseTaskStore.mockReturnValue({
      tasks: {},
    } as any)

    render(<TaskStats />)

    // Check grid layout
    const container = screen.getByText('Total Tasks').closest('.grid')
    expect(container).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4')
  })
})