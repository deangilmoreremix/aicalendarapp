/**
 * Pieces of Twenty's TaskRow (due-date state, assignee, quick due-date edit) for this app's task lists.
 * Small additions inside the existing rows; they use the same colours and sizes the lists already use.
 */
import { useState } from 'react';
import { Star } from 'lucide-react';

import { useTaskStore } from '../../store/taskStore';
import { initialsAvatar } from '../../utils/avatars';
import { DUE_CHIP_CLASSES, getDueChip } from '../../utils/dueChip';
import type { Task } from '../../types';

export const TaskDueChip = ({ task }: { task: Pick<Task, 'dueDate' | 'completed'> }) => {
  const chip = getDueChip(task);
  if (!chip) return null;
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${DUE_CHIP_CLASSES[chip.tone]}`}>{chip.label}</span>;
};

export const AssigneeAvatar = ({ name }: { name?: string }) =>
  name ? <img src={initialsAvatar(name, 24)} alt={name} title={name} className="h-6 w-6 shrink-0 rounded-full" /> : null;

export const TaskFavoriteStar = ({ task }: { task: Pick<Task, 'id' | 'isFavorite'> }) => {
  const rescheduleTask = useTaskStore((s) => s.rescheduleTask);
  return (
    <button
      type="button"
      aria-label={task.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={!!task.isFavorite}
      onClick={(e) => {
        e.stopPropagation();
        void rescheduleTask(task.id, { isFavorite: !task.isFavorite });
      }}
      className={task.isFavorite ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}
    >
      <Star className={`h-4 w-4 ${task.isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
};

const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The due chip; click it to change the due date in place (keeps the time of day). */
export const InlineDueDate = ({ task }: { task: Pick<Task, 'id' | 'title' | 'dueDate' | 'completed'> }) => {
  const rescheduleTask = useTaskStore((s) => s.rescheduleTask);
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        aria-label={`Due date for ${task.title}`}
        defaultValue={task.dueDate ? toLocalInput(task.dueDate) : ''}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
        onChange={(e) => {
          if (!e.target.value) return;
          const [y, m, d] = e.target.value.split('-').map(Number);
          const next = new Date(task.dueDate ?? new Date());
          next.setFullYear(y, m - 1, d);
          void rescheduleTask(task.id, { dueDate: next });
          setEditing(false);
        }}
        className="rounded border border-gray-300 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800"
      />
    );
  }
  return (
    <button
      type="button"
      title="Change due date"
      aria-label={`${getDueChip(task)?.label ?? 'Set due date'}: change due date for ${task.title}`}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {getDueChip(task) ? <TaskDueChip task={task} /> : <span className="text-xs text-gray-400">Set due date</span>}
    </button>
  );
};
