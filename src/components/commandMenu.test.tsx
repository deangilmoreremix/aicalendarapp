import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return {
    ...actual,
    taskApi: { ...actual.taskApi, getAll: vi.fn().mockResolvedValue([]) },
    dealApi: { ...actual.dealApi, getAll: vi.fn().mockResolvedValue([]) },
    contactApi: { ...actual.contactApi, getAll: vi.fn().mockResolvedValue([]) },
    calendarEventApi: { ...actual.calendarEventApi, getSettings: vi.fn().mockResolvedValue({ defaultVisibility: 'SHARE_EVERYTHING' }), getTimeline: vi.fn().mockResolvedValue({ timelineCalendarEvents: [], totalNumberOfCalendarEvents: 0 }) },
    activityApi: { ...actual.activityApi, getForEntity: vi.fn().mockResolvedValue([]), getAll: vi.fn().mockResolvedValue([]) }
  };
});
const toggleTheme = vi.fn();
vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false, toggleTheme }) }));
vi.mock('../contexts/AIContext', () => {
  const ai = { generateTaskSuggestions: vi.fn(async () => []), generateInsights: vi.fn(async () => []), predictNextBestAction: vi.fn(async () => ''), isProcessing: false };
  return { useAI: () => ai, AIProvider: ({ children }: any) => <>{children}</> };
});

import { CommandMenu, CommandMenuButton } from './CommandMenu';
import { useTaskStore } from '../store/taskStore';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { useOpenRecordStore } from '../store/openRecordStore';

const handlers = () => ({ onNavigate: vi.fn(), onNewContact: vi.fn(), onNewDeal: vi.fn(), onOpenSettings: vi.fn(), onDeleteMockData: vi.fn() });
const press = () => fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
const box = () => screen.getByRole('combobox', { name: 'Search records and commands' });

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  useOpenRecordStore.setState({ target: null });
  useTaskStore.setState({ tasks: { t1: { id: 't1', title: 'Send proposal to TechCorp', status: 'pending', priority: 'high', isFavorite: true } as any }, calendarEvents: [{ id: 'e1', title: 'Renewal call' } as any] });
  useDealStore.setState({ deals: { d1: { id: 'd1', company: 'TechCorp Solutions', value: '$85,000', stage: 'negotiation' } as any } });
  useContactStore.setState({ contacts: { c1: { id: 'c1', name: 'Ada Lovelace', company: 'TechCorp', title: 'CTO', email: 'ada@x.io' } as any } });
});

describe('CommandMenu', () => {
  it('opens with Ctrl+K (and Cmd+K), closes with Escape', async () => {
    render(<CommandMenu {...handlers()} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    press();
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull());
    fireEvent.keyDown(document, { key: 'K', metaKey: true });
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  it('the header button opens it', async () => {
    render(<><CommandMenuButton isDark={false} /><CommandMenu {...handlers()} /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Open command menu' }));
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  it('finds records across types and opens the chosen one with Enter', async () => {
    render(<CommandMenu {...handlers()} />);
    press();
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'techcorp' } });
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('TechCorp Solutions'), expect.stringContaining('Send proposal to TechCorp'), expect.stringContaining('Ada Lovelace')]));
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    const second = screen.getAllByRole('option')[1];
    expect(second).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(box(), { key: 'Enter' });
    const target = useOpenRecordStore.getState().target!;
    expect(['deal', 'task', 'contact']).toContain(target.type);
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull());
  });

  it('runs commands: navigation, new contact, theme', async () => {
    const h = handlers();
    render(<CommandMenu {...h} />);
    press();
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'kanban' } });
    fireEvent.click(screen.getByRole('option', { name: /Go to Kanban board/ }));
    expect(h.onNavigate).toHaveBeenCalledWith('kanban');

    press();
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'new contact' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(h.onNewContact).toHaveBeenCalled();

    press();
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'dark' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(toggleTheme).toHaveBeenCalled();
  });

  it('"New task" opens the task form', async () => {
    render(<CommandMenu {...handlers()} />);
    press();
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'new task' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(await screen.findByText('Create New Task')).toBeInTheDocument();
  });

  it('shows recent and favorite records first when the box is empty, and remembers what you open', async () => {
    render(<CommandMenu {...handlers()} />);
    press();
    expect(await screen.findByText('Recent and favorites')).toBeInTheDocument();
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Send proposal to TechCorp'); // the favorite
    fireEvent.change(box(), { target: { value: 'ada' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    press();
    await screen.findByText('Recent and favorites');
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Ada Lovelace'); // now the most recent
  });

  it('says so when nothing matches', async () => {
    render(<CommandMenu {...handlers()} />);
    press();
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'zzzzqq' } });
    expect(screen.getByText(/No results for/)).toBeInTheDocument();
  });
});
