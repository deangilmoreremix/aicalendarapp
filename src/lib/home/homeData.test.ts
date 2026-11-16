import { describe, it, expect } from 'vitest';
import { plainSnippet, completedAndPending, formatMoney, funnelFromDeals, interactionsFromDeals, monthAssignees, parseMoney, recentFromActivities, relativeTime, startOfWeek, weekOverWeek, weekSchedule } from './homeData';

const now = new Date(2026, 10, 18, 12); // Wednesday
const d = (day: number, h = 12) => new Date(2026, 10, day, h);
const task = (o: any = {}) => ({ id: 't', title: 't', completed: false, status: 'pending', ...o });

describe('weeks and trends', () => {
  it('starts weeks on Monday', () => {
    expect(startOfWeek(now).getDate()).toBe(16);
    expect(startOfWeek(new Date(2026, 10, 15)).getDate()).toBe(9); // a Sunday belongs to the week before
  });
  it('compares this week with last and gives no percentage without a baseline', () => {
    expect(weekOverWeek([d(16), d(17), d(18), d(9)], now)).toEqual({ current: 3, previous: 1, pct: 200 });
    expect(weekOverWeek([d(16), d(10), d(11)], now)).toEqual({ current: 1, previous: 2, pct: -50 });
    expect(weekOverWeek([d(16)], now)).toEqual({ current: 1, previous: 0, pct: null });
    expect(weekOverWeek([d(1), undefined], now)).toEqual({ current: 0, previous: 0, pct: null });
  });
});

describe('schedule', () => {
  const tasks = [task({ id: '1', dueDate: d(16), assignedUserId: 'u1', assignedUserName: 'Sam' }), task({ id: '2', dueDate: d(16, 15), assignedUserId: 'u1', assignedUserName: 'Sam' }), task({ id: '3', dueDate: d(18), assignedUserId: 'u2', assignedUserName: 'Priya' }), task({ id: '4', dueDate: d(25) })] as any[];
  it('counts the current week by day with unique assignees', () => {
    const w = weekSchedule(tasks, now);
    expect(w.map((x) => x.tasks)).toEqual([2, 0, 1, 0, 0, 0, 0]);
    expect(w[0].assignees).toEqual([{ id: 'u1', name: 'Sam' }]);
    expect(w[0].day).toBe('Mon');
  });
  it('lists assignees for every day of the month', () => {
    const m = monthAssignees(tasks, now);
    expect(m).toHaveLength(30);
    expect(m[17].assignees.map((a) => a.name)).toEqual(['Priya']);
    expect(m[24].assignees).toEqual([]); // a task without an assignee adds nobody
  });
});

describe('funnel and money', () => {
  const deals = [
    { stage: 'proposal', value: '$85,000', probability: '50' },
    { stage: 'proposal', value: '$15,000', probability: '100' },
    { stage: 'closed-won', value: '$40,000', probability: '100' },
    { stage: 'closed-lost', value: '$99,000', probability: '0' }
  ] as any[];
  it('parses money', () => {
    expect([parseMoney('$85,000'), parseMoney('n/a'), parseMoney(12), parseMoney(undefined)]).toEqual([85000, 0, 12, 0]);
    expect(formatMoney(1234567.4)).toBe('$1,234,567');
  });
  it('sums open pipeline, weighted value and per-stage totals', () => {
    const f = funnelFromDeals(deals);
    expect(f.openTotal).toBe(100000);
    expect(f.weighted).toBe(57500);
    expect(f.openCount).toBe(2);
    expect(f.rows.find((r) => r.stage === 'proposal')).toMatchObject({ count: 2, value: 100000 });
    expect(f.rows.find((r) => r.stage === 'closed-won')?.value).toBe(40000);
  });
  it('is all zeros for no deals', () => {
    expect(funnelFromDeals([])).toMatchObject({ openTotal: 0, weighted: 0, openCount: 0 });
  });
});

describe('recent activity', () => {
  it('formats relative times', () => {
    expect([relativeTime(new Date(now.getTime() - 20_000), now), relativeTime(new Date(now.getTime() - 5 * 60_000), now), relativeTime(new Date(now.getTime() - 3 * 3.6e6), now), relativeTime(new Date(now.getTime() - 1 * 3.6e6), now), relativeTime(new Date(now.getTime() - 2 * 864e5), now)]).toEqual(['just now', '5 min ago', '3 hours ago', '1 hour ago', '2 days ago']);
  });
  it('takes the newest items and classifies them', () => {
    const acts = [
      { id: 'a', type: 'deal_moved', title: 'Moved', createdAt: new Date(now.getTime() - 3.6e6) },
      { id: 'b', type: 'email_sent', title: 'Mail', description: 'hi', createdAt: new Date(now.getTime() - 60_000) },
      { id: 'c', type: 'note_added', title: 'Old', createdAt: new Date(2026, 0, 1) }
    ] as any[];
    const r = recentFromActivities(acts, 2, now);
    expect(r.map((x) => [x.id, x.kind, x.time])).toEqual([['b', 'email', '1 min ago'], ['a', 'deal', '1 hour ago']]);
    expect(recentFromActivities([], 5, now)).toEqual([]);
  });
  it('counts completed and pending tasks', () => {
    expect(completedAndPending([task({ completed: true }), task(), task({ status: 'cancelled' })] as any[])).toEqual({ completed: 1, pending: 1 });
  });
});

describe('plainSnippet', () => {
  it('drops markdown marks and links, joins lines and cuts long text', () => {
    expect(plainSnippet('**Prefers Thursday calls.**\n- Send deck\n- See [pricing](https://x.io/p)')).toBe('Prefers Thursday calls. Send deck See pricing');
    expect(plainSnippet('a'.repeat(200), 50)).toHaveLength(50);
    expect(plainSnippet('')).toBe('');
  });
});

describe('interactions', () => {
  it('turns the latest deals into cards with their contact', () => {
    const deals = [
      { id: '1', company: 'A', title: 'A deal', value: '$1', stage: 'closed-won', contactId: 'c1', updatedAt: new Date(2026, 9, 12) },
      { id: '2', company: 'B', value: '$2', stage: 'qualification', contactId: 'zz', updatedAt: new Date(2026, 9, 20) }
    ] as any[];
    const cards = interactionsFromDeals(deals, { c1: { name: 'Ada' } as any });
    expect(cards.map((c) => [c.id, c.title, c.status, c.people])).toEqual([['2', 'B', 'pending', []], ['1', 'A deal', 'success', ['Ada']]]);
    expect(cards[1].date).toBe('Oct 12');
  });
});
