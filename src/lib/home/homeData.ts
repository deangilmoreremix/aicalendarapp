/**
 * Pure helpers that turn the app's real records into the numbers shown on the home screen
 * (stat trends, this week's schedule, pipeline funnel, recent activity, latest deals).
 */
import type { Activity, Contact, Deal, Task } from '../../types';

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** Monday 00:00 of the week containing `d` */
export const startOfWeek = (d: Date) => {
  const s = startOfDay(d);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
};

export const parseMoney = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export const formatMoney = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

export interface Trend { current: number; previous: number; pct: number | null }

/** Events this week vs last week. `pct` is null when last week had none (no honest percentage exists). */
export const weekOverWeek = (dates: (Date | undefined)[], now: Date = new Date()): Trend => {
  const thisWeek = startOfWeek(now).getTime();
  const lastWeek = thisWeek - 7 * DAY;
  let current = 0;
  let previous = 0;
  for (const d of dates) {
    if (!d) continue;
    const t = d.getTime();
    if (t >= thisWeek && t < thisWeek + 7 * DAY) current++;
    else if (t >= lastWeek && t < thisWeek) previous++;
  }
  return { current, previous, pct: previous === 0 ? null : Math.round(((current - previous) / previous) * 100) };
};

export interface Assignee { id: string; name: string }

const assigneeOf = (t: Task): Assignee | null =>
  t.assignedUserName ? { id: t.assignedUserId ?? t.assignedUserName, name: t.assignedUserName } : null;

const uniqueAssignees = (tasks: Task[]): Assignee[] => {
  const map = new Map<string, Assignee>();
  for (const t of tasks) {
    const a = assigneeOf(t);
    if (a) map.set(a.id, a);
  }
  return [...map.values()];
};

const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

/** Mon..Sun of the current week: how many tasks are due each day and who they are assigned to. */
export const weekSchedule = (tasks: Task[], now: Date = new Date()) => {
  const monday = startOfWeek(now);
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return names.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const due = tasks.filter((t) => t.dueDate && sameDay(t.dueDate, date));
    return { day, date, tasks: due.length, assignees: uniqueAssignees(due) };
  });
};

/** For each day of the month containing `now`: who has tasks due that day. */
export const monthAssignees = (tasks: Task[], now: Date = new Date()) => {
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
    return { day: i + 1, assignees: uniqueAssignees(tasks.filter((t) => t.dueDate && sameDay(t.dueDate, date))) };
  });
};

const STAGE_ORDER: Deal['stage'][] = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won'];
const STAGE_LABEL: Record<string, string> = {
  prospecting: 'Prospecting', qualification: 'Qualification', proposal: 'Proposal', negotiation: 'Negotiation', 'closed-won': 'Closed won', 'closed-lost': 'Closed lost'
};

export interface FunnelRow { stage: string; label: string; count: number; value: number }

/** Open pipeline by stage (closed-lost excluded) plus its total; widths on screen are relative to the total. */
export const funnelFromDeals = (deals: Deal[]) => {
  const rows: FunnelRow[] = STAGE_ORDER.map((stage) => {
    const inStage = deals.filter((d) => d.stage === stage);
    return { stage, label: STAGE_LABEL[stage], count: inStage.length, value: inStage.reduce((s, d) => s + parseMoney(d.value), 0) };
  });
  const open = deals.filter((d) => d.stage !== 'closed-lost' && d.stage !== 'closed-won');
  return {
    rows,
    openTotal: open.reduce((s, d) => s + parseMoney(d.value), 0),
    weighted: open.reduce((s, d) => s + parseMoney(d.value) * (parseMoney(d.probability) / 100), 0),
    openCount: open.length
  };
};

export const relativeTime = (date: Date, now: Date = new Date()): string => {
  const mins = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

export type RecentKind = 'deal' | 'task' | 'meeting' | 'email' | 'call' | 'note' | 'other';

export interface RecentItem { id: string; kind: RecentKind; title: string; description: string; time: string; at: Date }

const recentKind = (type: string): RecentKind => {
  if (/^deal/.test(type)) return 'deal';
  if (/email/.test(type)) return 'email';
  if (/call/.test(type)) return 'call';
  if (/meeting/.test(type)) return 'meeting';
  if (/^note|comment/.test(type)) return 'note';
  if (/task|subtask/.test(type)) return 'task';
  return 'other';
};

/** One short plain line: formatting marks removed, links reduced to their text, long text cut. */
export const plainSnippet = (text: string, max = 140): string => {
  const flat = text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*`_#]/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s*\n+\s*/g, ' ')
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

export const recentFromActivities = (activities: Activity[], limit = 5, now: Date = new Date()): RecentItem[] =>
  [...activities]
    .sort((a, b) => +b.createdAt - +a.createdAt)
    .slice(0, limit)
    .map((a) => ({ id: a.id, kind: recentKind(a.type), title: a.title, description: plainSnippet(a.description ?? ''), time: relativeTime(a.createdAt, now), at: a.createdAt }));

export const completedAndPending = (tasks: Task[]) => ({
  completed: tasks.filter((t) => t.completed).length,
  pending: tasks.filter((t) => !t.completed && t.status !== 'cancelled').length
});

export interface InteractionCard { id: string; title: string; value: string; date: string; status: 'active' | 'success' | 'pending'; people: string[] }

/** The latest deals as cards (newest first), with the deal's contact as the participant. */
export const interactionsFromDeals = (deals: Deal[], contacts: Record<string, Contact>, limit = 3): InteractionCard[] =>
  [...deals]
    .sort((a, b) => +b.updatedAt - +a.updatedAt)
    .slice(0, limit)
    .map((d) => ({
      id: d.id,
      title: d.title || d.company,
      value: d.value,
      date: d.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: d.stage === 'closed-won' ? 'success' : d.stage === 'prospecting' || d.stage === 'qualification' ? 'pending' : 'active',
      people: [contacts[d.contactId]?.name].filter((n): n is string => !!n)
    }));
