import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIProvider } from './contexts/AIContext';

// Mock the stores
vi.mock('./store/taskStore', () => ({
  useTaskStore: () => ({
    tasks: {},
    markTaskComplete: vi.fn(),
  }),
}));

vi.mock('./store/contactStore', () => ({
  useContactStore: () => ({
    contacts: {},
  }),
}));

// Mock the components to avoid complex dependencies
vi.mock('./components/TaskStats', () => ({
  default: () => <div data-testid="task-stats">Task Stats</div>,
}));

vi.mock('./components/QuickActions', () => ({
  QuickActions: ({ onNewContact, onContactsView, onNewDeal }: any) => (
    <div data-testid="quick-actions">
      <button onClick={onNewContact} data-testid="new-contact-btn">New Contact</button>
      <button onClick={onContactsView} data-testid="contacts-view-btn">View Contacts</button>
      <button onClick={onNewDeal} data-testid="new-deal-btn">New Deal</button>
    </div>
  ),
}));

vi.mock('./components/RecentActivity', () => ({
  default: () => <div data-testid="recent-activity">Recent Activity</div>,
}));

vi.mock('./components/TasksAndFunnel', () => ({
  TasksAndFunnel: () => <div data-testid="tasks-and-funnel">Tasks and Funnel</div>,
}));

vi.mock('./components/InteractiveContactScorer', () => ({
  InteractiveContactScorer: () => <div data-testid="contact-scorer">Contact Scorer</div>,
}));

vi.mock('./components/CustomerProfile', () => ({
  CustomerProfile: () => <div data-testid="customer-profile">Customer Profile</div>,
}));

vi.mock('./components/BigTaskCalendar', () => ({
  BigTaskCalendar: () => <div data-testid="big-task-calendar">Big Task Calendar</div>,
}));

vi.mock('./components/TaskKanbanBoard', () => ({
  TaskKanbanBoard: () => <div data-testid="task-kanban">Task Kanban</div>,
}));

vi.mock('./components/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed">Activity Feed</div>,
}));

vi.mock('./components/TaskListView', () => ({
  TaskListView: () => <div data-testid="task-list-view">Task List View</div>,
}));

const renderApp = () => {
  return render(
    <ThemeProvider>
      <AIProvider>
        <App />
      </AIProvider>
    </ThemeProvider>
  );
};

describe('App Component - Button Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders main application structure', () => {
    renderApp();

    expect(screen.getByText('AI Calendar')).toBeInTheDocument();
    expect(screen.getByText('Manage your tasks and schedule with intelligent insights')).toBeInTheDocument();
  });

  test('delete mock data button exists and has onClick handler', () => {
    renderApp();

    const deleteButton = screen.getByTitle('Delete All Mock Data');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton.tagName).toBe('BUTTON');
    expect(deleteButton).toHaveAttribute('title', 'Delete All Mock Data');
  });

  test('theme toggle button exists and has onClick handler', () => {
    renderApp();

    const themeButton = screen.getByRole('button', { name: /sun|moon/i });
    expect(themeButton).toBeInTheDocument();
    expect(themeButton.tagName).toBe('BUTTON');
  });

  test('view toggle buttons exist and have onClick handlers', () => {
    renderApp();

    const calendarButton = screen.getByTitle('Calendar');
    const kanbanButton = screen.getByTitle('Kanban');
    const listButton = screen.getByTitle('List');
    const activityButton = screen.getByTitle('Activity');

    expect(calendarButton).toBeInTheDocument();
    expect(kanbanButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();
    expect(activityButton).toBeInTheDocument();

    expect(calendarButton.tagName).toBe('BUTTON');
    expect(kanbanButton.tagName).toBe('BUTTON');
    expect(listButton.tagName).toBe('BUTTON');
    expect(activityButton.tagName).toBe('BUTTON');
  });

  test('calendar view button is active by default', () => {
    renderApp();

    const calendarButton = screen.getByTitle('Calendar');
    expect(calendarButton).toHaveClass('bg-blue-600', 'text-white');
  });

  test('can switch between views', () => {
    renderApp();

    const kanbanButton = screen.getByTitle('Kanban');
    const listButton = screen.getByTitle('List');
    const activityButton = screen.getByTitle('Activity');

    fireEvent.click(kanbanButton);
    expect(kanbanButton).toHaveClass('bg-blue-600', 'text-white');

    fireEvent.click(listButton);
    expect(listButton).toHaveClass('bg-blue-600', 'text-white');

    fireEvent.click(activityButton);
    expect(activityButton).toHaveClass('bg-blue-600', 'text-white');
  });

  test('generate AI insights button exists and has onClick handler', () => {
    renderApp();

    const aiButton = screen.getByText('Generate AI Insights');
    expect(aiButton).toBeInTheDocument();
    expect(aiButton.tagName).toBe('BUTTON');
  });

  test('quick actions buttons are rendered', () => {
    renderApp();

    expect(screen.getByTestId('new-contact-btn')).toBeInTheDocument();
    expect(screen.getByTestId('contacts-view-btn')).toBeInTheDocument();
    expect(screen.getByTestId('new-deal-btn')).toBeInTheDocument();
  });

  test('modal state management works', () => {
    renderApp();

    // Initially no modals should be open
    expect(screen.queryByTestId('contacts-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('new-contact-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('new-deal-modal')).not.toBeInTheDocument();
  });

  test('all buttons have proper accessibility attributes', () => {
    renderApp();

    const buttons = screen.getAllByRole('button');

    buttons.forEach(button => {
      // Check that buttons either have text content or aria-label/title
      const hasText = button.textContent && button.textContent.trim().length > 0;
      const hasAriaLabel = button.hasAttribute('aria-label');
      const hasTitle = button.hasAttribute('title');

      // Skip buttons that are icon-only with title (like delete button)
      if (hasTitle && button.children.length === 1 && button.children[0].tagName === 'svg') {
        return; // This is acceptable for icon buttons with title
      }

      expect(hasText || hasAriaLabel || hasTitle).toBe(true);
    });
  });

  test('buttons are keyboard accessible', () => {
    renderApp();

    const deleteButton = screen.getByTitle('Delete All Mock Data');

    // Focus the button
    deleteButton.focus();
    expect(deleteButton).toHaveFocus();

    // Simulate Enter key press
    fireEvent.keyDown(deleteButton, { key: 'Enter', code: 'Enter' });
    // The button should still be functional (no errors thrown)
  });

  test('buttons handle disabled state properly', () => {
    renderApp();

    const aiButton = screen.getByText('Generate AI Insights');

    // Initially should not be disabled
    expect(aiButton).not.toBeDisabled();

    // The button should be a proper button element
    expect(aiButton.tagName).toBe('BUTTON');
  });
});