import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({ activities: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return {
    ...actual,
    activityApi: { ...actual.activityApi, getAll: api.activities },
    dealApi: { ...actual.dealApi, getAll: vi.fn().mockResolvedValue([]) },
    contactApi: { ...actual.contactApi, getAll: vi.fn().mockResolvedValue([]) },
    taskApi: { ...actual.taskApi, getAll: vi.fn().mockResolvedValue([]) }
  };
});
vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../contexts/AIContext', () => {
  const ai = { generateInsights: vi.fn(async () => []), predictDealSuccess: vi.fn(async () => 50), generateTaskSuggestions: vi.fn(async () => []), predictNextBestAction: vi.fn(async () => ''), optimizeMeetingTime: vi.fn(async () => []), generateMeetingAgenda: vi.fn(async () => []), isProcessing: false };
  return { useAI: () => ai, AIProvider: ({ children }: any) => <>{children}</> };
});

import TaskStats from './TaskStats';
import { InteractionHistory } from './InteractionHistory';
import RecentActivity from './RecentActivity';
import { useTaskStore } from '../store/taskStore';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';

const monday = () => {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
};
const task = (id: string, createdAt: Date, over: any = {}) => ({ id, title: id, completed: false, status: 'pending', priority: 'low', tags: [], attachments: [], subtasks: [], createdAt, ...over });

beforeEach(() => {
  vi.clearAllMocks();
  api.activities.mockResolvedValue([]);
  useTaskStore.setState({ tasks: {} });
  useDealStore.setState({ deals: {} });
  useContactStore.setState({ contacts: {} });
});

describe('TaskStats trends are real', () => {
  it('shows no percentage when there is no earlier week to compare with', () => {
    useTaskStore.setState({ tasks: { a: task('a', new Date()) as any } });
    render(<TaskStats />);
    expect(screen.queryByText(/%$/)).toBeNull();
    expect(screen.queryByText('+12%')).toBeNull();
  });

  it('shows the real week-over-week change', () => {
    const lastWeek = new Date(monday().getTime() - 2 * 864e5);
    useTaskStore.setState({ tasks: { a: task('a', new Date()) as any, b: task('b', new Date()) as any, c: task('c', lastWeek) as any } });
    render(<TaskStats />);
    expect(screen.getByText('+100%')).toBeInTheDocument(); // 2 created this week vs 1 last week
    expect(screen.getByTitle('2 this week, 1 last week')).toBeInTheDocument();
  });

  it('shows a drop as negative', () => {
    const lastWeek = new Date(monday().getTime() - 2 * 864e5);
    useTaskStore.setState({ tasks: { a: task('a', new Date()) as any, c: task('c', lastWeek) as any, d: task('d', lastWeek) as any } });
    render(<TaskStats />);
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });
});

describe('InteractionHistory shows real deals', () => {
  it('has an empty state, then lists the latest deals and opens one', async () => {
    const { unmount } = render(<InteractionHistory />);
    expect(screen.getByText(/No deals yet/)).toBeInTheDocument();
    expect(screen.queryByText('Royal Package Opportunity')).toBeNull();
    unmount();
    useDealStore.setState({ deals: { d1: { id: 'd1', company: 'TechCorp', title: 'Renewal', value: '$85,000', stage: 'negotiation', contactId: 'c1', updatedAt: new Date(2026, 9, 12) } as any } });
    useContactStore.setState({ contacts: { c1: { id: 'c1', name: 'Ada Lovelace' } as any } });
    render(<InteractionHistory />);
    expect(screen.getByText('Renewal')).toBeInTheDocument();
    expect(screen.getByText('$85,000')).toBeInTheDocument();
    expect(screen.getByText('Oct 12')).toBeInTheDocument();
  });
});

describe('RecentActivity shows real activity', () => {
  it('lists the newest real activities with relative times and real task counts', async () => {
    api.activities.mockResolvedValue([
      { id: 'a1', type: 'email_sent', title: 'Email: Pricing', description: 'Sent **pricing**', userId: 'u', userName: 'You', entityType: 'contact', entityId: 'c', createdAt: new Date(Date.now() - 3 * 3.6e6) }
    ]);
    useTaskStore.setState({ tasks: { a: task('a', new Date(), { completed: true }) as any, b: task('b', new Date()) as any } });
    render(<RecentActivity />);
    expect(await screen.findByText('Email: Pricing')).toBeInTheDocument();
    expect(screen.getByText('Sent pricing')).toBeInTheDocument();
    expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();
    expect(screen.getByText('1 pending')).toBeInTheDocument();
    expect(screen.queryByText('Follow-up call with Innovation Labs')).toBeNull();
  });

  it('shows an empty state instead of invented activity', async () => {
    render(<RecentActivity />);
    expect(await screen.findByText(/No activity yet/)).toBeInTheDocument();
    expect(screen.queryByText('Deal moved to negotiation')).toBeNull();
    await waitFor(() => expect(api.activities).toHaveBeenCalled());
  });
});
