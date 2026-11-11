import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({
  getSettings: vi.fn(),
  setDefaultVisibility: vi.fn(),
  activities: vi.fn(),
  dealGetAll: vi.fn(),
  taskGetAll: vi.fn(),
  contactGetAll: vi.fn()
}));

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api')>();
  return {
    ...actual,
    activityApi: { ...actual.activityApi, getAll: api.activities },
    dealApi: { ...actual.dealApi, getAll: api.dealGetAll },
    taskApi: { ...actual.taskApi, getAll: api.taskGetAll },
    contactApi: { ...actual.contactApi, getAll: api.contactGetAll },
    calendarEventApi: { ...actual.calendarEventApi, getSettings: api.getSettings, setDefaultVisibility: api.setDefaultVisibility, getTimeline: vi.fn().mockResolvedValue({ timelineCalendarEvents: [], totalNumberOfCalendarEvents: 0 }) }
  };
});

const ai = vi.hoisted(() => ({
  generateInsights: vi.fn(async () => []),
  predictNextBestAction: vi.fn(async () => 'Call Ada'),
  analyzeInteractionHistory: vi.fn(async () => ({ totalInteractions: 2, lastInteraction: null, meetingCount: 1, engagementTrend: 'stable' })),
  predictDealSuccess: vi.fn(async () => 61),
  scoreContact: vi.fn(async () => 70),
  isProcessing: false
}));
vi.mock('../../contexts/AIContext', () => ({ useAI: () => ai, AIProvider: ({ children }: any) => <>{children}</> }));

import { CalendarSettings } from '../../components/CalendarSettings';
import { AIInsightsDashboardModal } from '../../components/ui/AIInsightsDashboardModal';
import { DealsManagementModal } from '../../components/ui/DealsManagementModal';
import { CustomerProfile } from '../../components/CustomerProfile';
import { ActivityFeed } from '../../components/ActivityFeed';
import { useContactStore } from '../../store/contactStore';
import { useDealStore } from '../../store/dealStore';
import { useTaskStore } from '../../store/taskStore';
import type { Contact, Deal, Task } from '../../types';

const contact = (over: Partial<Contact> = {}): Contact => ({
  id: 'c1', firstName: 'Ada', lastName: 'Lovelace', name: 'Ada Lovelace', email: 'ada@x.io', title: 'CTO', company: 'Analytical',
  sources: [], interestLevel: 'hot', status: 'lead', tags: [], socialProfiles: {}, customFields: {}, isFavorite: false,
  createdAt: new Date(), updatedAt: new Date(), ...over
});
const deal = (over: Partial<Deal> = {}): Deal => ({
  id: 'd1', company: 'TechCorp', value: '$85,000', probability: '85', dueDate: '2030-03-12', contactId: 'c1', status: 'online',
  stage: 'negotiation', priority: 'high', createdAt: new Date(), updatedAt: new Date(), ...over
});
const task = (over: Partial<Task> = {}): Task => ({
  id: 't1', title: 'Send proposal', priority: 'high', status: 'pending', category: 'other', type: 'other', completed: false,
  createdAt: new Date(), tags: [], attachments: [], subtasks: [], ...over
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  api.getSettings.mockResolvedValue({ defaultVisibility: 'SHARE_EVERYTHING' });
  api.setDefaultVisibility.mockResolvedValue(undefined);
  api.activities.mockResolvedValue([]);
  api.dealGetAll.mockResolvedValue([]);
  api.taskGetAll.mockResolvedValue([]);
  api.contactGetAll.mockResolvedValue([]);
  useContactStore.setState({ contacts: { c1: contact() } });
  useDealStore.setState({ deals: { d1: deal(), d2: deal({ id: 'd2', company: 'Globex', stage: 'proposal', dueDate: 'Next Week' }) } });
  useTaskStore.setState({ tasks: { t1: task() } });
});

describe('CalendarSettings', () => {
  it('saves preferences (time zone, week start, work hours, meeting length) to localStorage', () => {
    render(<CalendarSettings />);
    fireEvent.change(screen.getByDisplayValue(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'), { target: { value: 'Europe/Paris' } });
    fireEvent.change(screen.getByDisplayValue('Monday'), { target: { value: '0' } });
    fireEvent.change(screen.getByDisplayValue('30'), { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const saved = JSON.parse(localStorage.getItem('calendar-preferences')!);
    expect(saved).toMatchObject({ timezone: 'Europe/Paris', weekStartsOn: 0, defaultMeetingMinutes: 45 });
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('never goes below a 5 minute default meeting', () => {
    render(<CalendarSettings />);
    fireEvent.change(screen.getByDisplayValue('30'), { target: { value: '-3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(JSON.parse(localStorage.getItem('calendar-preferences')!).defaultMeetingMinutes).toBeGreaterThanOrEqual(5);
  });

  it('loads and saves the default event visibility; a failed save reverts the choice', async () => {
    api.getSettings.mockResolvedValue({ defaultVisibility: 'METADATA' });
    render(<CalendarSettings />);
    await waitFor(() => expect(screen.getByLabelText(/Metadata/)).toBeChecked());
    fireEvent.click(screen.getByLabelText(/Everything/));
    await waitFor(() => expect(api.setDefaultVisibility).toHaveBeenCalledWith('SHARE_EVERYTHING'));

    api.setDefaultVisibility.mockRejectedValueOnce(new Error('x'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fireEvent.click(screen.getByLabelText(/Metadata/));
    expect(await screen.findByText('Could not save event visibility.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Everything/)).toBeChecked();
  });

  it('survives corrupt saved preferences', () => {
    localStorage.setItem('calendar-preferences', '{not json');
    expect(() => render(<CalendarSettings />)).not.toThrow();
  });
});

describe('AIInsightsDashboardModal', () => {
  it('asks for insights grounded in the contacts, deals and tasks in the stores', async () => {
    render(<AIInsightsDashboardModal isOpen onClose={() => {}} />);
    await waitFor(() => expect(ai.generateInsights).toHaveBeenCalled());
    const [contacts, extra] = ai.generateInsights.mock.calls[0] as any[];
    expect(contacts.map((c: Contact) => c.id)).toEqual(['c1']);
    expect(extra.deals.map((d: Deal) => d.id).sort()).toEqual(['d1', 'd2']);
    expect(extra.tasks.map((t: Task) => t.id)).toEqual(['t1']);
  });

  it('does not call the AI while closed', () => {
    render(<AIInsightsDashboardModal isOpen={false} onClose={() => {}} />);
    expect(ai.generateInsights).not.toHaveBeenCalled();
  });
});

describe('DealsManagementModal', () => {
  it('lists stored deals, searches them, and opens one', async () => {
    const onDealClick = vi.fn();
    render(<DealsManagementModal isOpen onClose={() => {}} onDealClick={onDealClick} />);
    expect(await screen.findByText('TechCorp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'glob' } });
    await waitFor(() => expect(screen.queryByText('TechCorp')).toBeNull());
    fireEvent.click(screen.getByText('Globex'));
    expect(onDealClick).toHaveBeenCalledWith('d2');
  });
});

describe('CustomerProfile and ActivityFeed (contacts are a record in the store, not an array)', () => {
  it('CustomerProfile shows the first contact and AI context built from real data', async () => {
    render(<CustomerProfile />);
    expect((await screen.findAllByText('Ada Lovelace')).length).toBeGreaterThan(0);
    await waitFor(() => expect(ai.predictNextBestAction).toHaveBeenCalledWith('c1', expect.objectContaining({ id: 'c1', title: 'CTO' })));
  });

  it('CustomerProfile offers a contact switcher only with more than one contact', () => {
    useContactStore.setState({ contacts: { c1: contact(), c2: contact({ id: 'c2', name: 'Grace Hopper', firstName: 'Grace', lastName: 'Hopper' }) } });
    render(<CustomerProfile />);
    expect(screen.getByText('Switch Contact')).toBeInTheDocument();
  });

  it('ActivityFeed renders without crashing when contacts and tasks come from the stores', async () => {
    render(<ActivityFeed />);
    expect(await screen.findByText(/activity/i)).toBeInTheDocument();
  });
});
