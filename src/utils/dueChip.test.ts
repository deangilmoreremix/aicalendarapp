import { describe, it, expect } from 'vitest';
import { getDueChip } from './dueChip';

const now = new Date(2026, 10, 16, 15);
describe('getDueChip', () => {
  it('has no chip without a due date', () => expect(getDueChip({}, now)).toBeNull());
  it('marks past open tasks overdue', () => {
    expect(getDueChip({ dueDate: new Date(2026, 10, 15, 9) }, now)).toEqual({ label: 'Overdue · yesterday', tone: 'overdue' });
    expect(getDueChip({ dueDate: new Date(2026, 10, 3) }, now)).toEqual({ label: 'Overdue · Nov 3', tone: 'overdue' });
  });
  it('is "Today" for any time today, even earlier than now', () => {
    expect(getDueChip({ dueDate: new Date(2026, 10, 16, 8) }, now)?.tone).toBe('today');
  });
  it('labels tomorrow and later dates', () => {
    expect(getDueChip({ dueDate: new Date(2026, 10, 17) }, now)).toEqual({ label: 'Tomorrow', tone: 'upcoming' });
    expect(getDueChip({ dueDate: new Date(2026, 10, 30) }, now)).toEqual({ label: 'Nov 30', tone: 'upcoming' });
  });
  it('a completed task is never overdue', () => {
    expect(getDueChip({ dueDate: new Date(2026, 10, 1), completed: true }, now)).toEqual({ label: 'Nov 1', tone: 'done' });
  });
});
