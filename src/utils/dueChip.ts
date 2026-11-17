/**
 * Due-date chip for a task row (Twenty's TaskRow shows overdue / today / upcoming state next to the title).
 * The rule is ours: tone and label only, styling stays with the caller.
 */
export type DueChip = { label: string; tone: 'overdue' | 'today' | 'upcoming' | 'done' };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getDueChip = (task: { dueDate?: Date; completed?: boolean }, now: Date = new Date()): DueChip | null => {
  if (!task.dueDate) return null;
  const date = `${MONTHS[task.dueDate.getMonth()]} ${task.dueDate.getDate()}`;
  if (task.completed) return { label: date, tone: 'done' };
  const days = Math.round((startOfDay(task.dueDate) - startOfDay(now)) / 86_400_000);
  if (days < 0) return { label: days === -1 ? 'Overdue · yesterday' : `Overdue · ${date}`, tone: 'overdue' };
  if (days === 0) return { label: 'Today', tone: 'today' };
  if (days === 1) return { label: 'Tomorrow', tone: 'upcoming' };
  return { label: date, tone: 'upcoming' };
};

export const DUE_CHIP_CLASSES: Record<DueChip['tone'], string> = {
  overdue: 'bg-red-100 text-red-700',
  today: 'bg-amber-100 text-amber-800',
  upcoming: 'bg-gray-100 text-gray-600',
  done: 'bg-green-100 text-green-700'
};
