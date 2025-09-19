import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { QuickActions } from './QuickActions';

// Mock the modal components
vi.mock('./ui/MeetingSchedulerModal', () => ({
  MeetingSchedulerModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="meeting-scheduler-modal">Meeting Scheduler</div> : null,
}));

vi.mock('./ui/EmailComposerModal', () => ({
  EmailComposerModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="email-composer-modal">Email Composer</div> : null,
}));

vi.mock('./ui/GlassCard', () => ({
  GlassCard: ({ children }: any) => <div data-testid="glass-card">{children}</div>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div>Plus</div>,
  UserPlus: () => <div>UserPlus</div>,
  Calendar: () => <div>Calendar</div>,
  Mail: () => <div>Mail</div>,
  Users: () => <div>Users</div>,
}));

describe('QuickActions Component - Button Functionality', () => {
  const mockOnNewContact = vi.fn();
  const mockOnContactsView = vi.fn();
  const mockOnNewDeal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderQuickActions = (props = {}) => {
    return render(
      <QuickActions
        onNewContact={mockOnNewContact}
        onContactsView={mockOnContactsView}
        onNewDeal={mockOnNewDeal}
        {...props}
      />
    );
  };

  test('renders all quick action buttons', () => {
    renderQuickActions();

    expect(screen.getByText('New Deal')).toBeInTheDocument();
    expect(screen.getByText('New Contact')).toBeInTheDocument();
    expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
    expect(screen.getByText('Send Email')).toBeInTheDocument();
    expect(screen.getByText('View All Contacts')).toBeInTheDocument();
  });

  test('all buttons have proper onClick handlers', () => {
    renderQuickActions();

    const buttons = screen.getAllByRole('button');

    // Test that clicking buttons calls the expected functions
    const newContactButton = screen.getByText('New Contact');
    const viewContactsButton = screen.getByText('View All Contacts');
    const newDealButton = screen.getByText('New Deal');

    fireEvent.click(newContactButton);
    expect(mockOnNewContact).toHaveBeenCalledTimes(1);

    fireEvent.click(viewContactsButton);
    expect(mockOnContactsView).toHaveBeenCalledTimes(1);

    fireEvent.click(newDealButton);
    expect(mockOnNewDeal).toHaveBeenCalledTimes(1);
  });

  test('New Deal button calls onNewDeal when provided', () => {
    renderQuickActions();

    const newDealButton = screen.getByText('New Deal');
    fireEvent.click(newDealButton);

    expect(mockOnNewDeal).toHaveBeenCalledTimes(1);
  });

  test('New Contact button calls onNewContact', () => {
    renderQuickActions();

    const newContactButton = screen.getByText('New Contact');
    fireEvent.click(newContactButton);

    expect(mockOnNewContact).toHaveBeenCalledTimes(1);
  });

  test('View All Contacts button calls onContactsView', () => {
    renderQuickActions();

    const viewContactsButton = screen.getByText('View All Contacts');
    fireEvent.click(viewContactsButton);

    expect(mockOnContactsView).toHaveBeenCalledTimes(1);
  });

  test('Schedule Meeting button opens meeting scheduler modal', () => {
    renderQuickActions();

    const scheduleButton = screen.getByText('Schedule Meeting');
    fireEvent.click(scheduleButton);

    expect(screen.getByTestId('meeting-scheduler-modal')).toBeInTheDocument();
  });

  test('Send Email button opens email composer modal', () => {
    renderQuickActions();

    const emailButton = screen.getByText('Send Email');
    fireEvent.click(emailButton);

    expect(screen.getByTestId('email-composer-modal')).toBeInTheDocument();
  });

  test('buttons have proper accessibility attributes', () => {
    renderQuickActions();

    const buttons = screen.getAllByRole('button');

    buttons.forEach(button => {
      // Check that buttons have text content
      expect(button.textContent).toBeTruthy();
      expect(button.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  test('buttons are keyboard accessible', () => {
    renderQuickActions();

    const newContactButton = screen.getByText('New Contact');

    // Focus the button
    newContactButton.focus();
    expect(newContactButton).toHaveFocus();

    // Simulate Enter key press
    fireEvent.keyDown(newContactButton, { key: 'Enter', code: 'Enter' });
    expect(mockOnNewContact).toHaveBeenCalledTimes(1);

    // Simulate Space key press
    fireEvent.keyDown(newContactButton, { key: ' ', code: 'Space' });
    expect(mockOnNewContact).toHaveBeenCalledTimes(2);
  });

  test('buttons have hover effects', () => {
    renderQuickActions();

    const buttons = screen.getAllByRole('button');

    buttons.forEach(button => {
      // Check that buttons have some hover styling
      const hasHoverClass = button.className.includes('hover:');
      expect(hasHoverClass).toBe(true);
    });
  });

  test('action buttons have proper styling', () => {
    renderQuickActions();

    const newDealButton = screen.getByText('New Deal');
    const newContactButton = screen.getByText('New Contact');
    const scheduleButton = screen.getByText('Schedule Meeting');
    const emailButton = screen.getByText('Send Email');

    // Check that they are button elements
    expect(newDealButton.tagName).toBe('BUTTON');
    expect(newContactButton.tagName).toBe('BUTTON');
    expect(scheduleButton.tagName).toBe('BUTTON');
    expect(emailButton.tagName).toBe('BUTTON');

    // Check that they have some background styling
    expect(newDealButton.className).toMatch(/bg-/);
    expect(newContactButton.className).toMatch(/bg-/);
    expect(scheduleButton.className).toMatch(/bg-/);
    expect(emailButton.className).toMatch(/bg-/);
  });

  test('View All Contacts button has proper styling', () => {
    renderQuickActions();

    const viewContactsButton = screen.getByText('View All Contacts');

    expect(viewContactsButton.tagName).toBe('BUTTON');
    expect(viewContactsButton.className).toMatch(/bg-blue/);
    expect(viewContactsButton.className).toMatch(/text-white/);
  });
});