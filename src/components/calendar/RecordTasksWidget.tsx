/**
 * Embedded task widget for a record (contact or deal).
 * Pattern from twentyhq/twenty TasksCard / TaskGroups: the widget receives the target record and shows its tasks,
 * grouped by status (rule in groupTasksByStatus.ts), each with a completion checkbox. Styled with this app's design.
 */
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

import { useTaskStore } from '../../store/taskStore';
import type { Task } from '../../types';
import { completionUpdate, groupTasksByStatus } from './groupTasksByStatus';
import { TaskDetailsModal } from '../TaskDetailsModal';

type RecordTasksWidgetProps = {
  targetType: 'contact' | 'deal';
  targetId: string;
  targetName: string;
};

const STATUS_LABELS: Record<Task['status'], string> = {
  pending: 'To Do',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  overdue: 'Overdue'
};

export const RecordTasksWidget = ({ targetType, targetId, targetName }: RecordTasksWidgetProps) => {
  const { tasks, loadInitialData, rescheduleTask } = useTaskStore();
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const recordTasks = useMemo(
    () => Object.values(tasks).filter((task) => task.relatedTo?.type === targetType && task.relatedTo.id === targetId),
    [tasks, targetType, targetId]
  );
  const groups = useMemo(() => groupTasksByStatus(recordTasks), [recordTasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tasks {recordTasks.length > 0 && <span className="text-sm font-normal text-gray-500">({recordTasks.length})</span>}
        </h3>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New task
        </button>
      </div>

      {recordTasks.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-800">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Mission accomplished!</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">All tasks addressed. Maintain the momentum.</p>
        </div>
      ) : (
        groups.map(([status, groupTasks]) => (
          <section key={status}>
            <h4 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              {STATUS_LABELS[status] ?? status} <span className="text-gray-400">{groupTasks.length}</span>
            </h4>
            <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              {groupTasks.map((task) => {
                const isPast = !!task.dueDate && task.dueDate < new Date() && !task.completed;
                return (
                  <li key={task.id} className="flex items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 dark:border-gray-800">
                    <input
                      type="checkbox"
                      aria-label={`Complete ${task.title}`}
                      checked={task.completed}
                      onChange={(e) => void rescheduleTask(task.id, completionUpdate(e.target.checked))}
                    />
                    <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => setOpenTask(task)}>
                      <span className={`font-medium text-gray-900 dark:text-gray-100 ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
                    </button>
                    {task.dueDate && (
                      <span className={`text-xs ${isPast ? 'text-red-600' : 'text-gray-500'}`}>{format(task.dueDate, 'MMM d')}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {(openTask || isCreating) && (
        <TaskDetailsModal
          task={openTask}
          isOpen
          defaultRelatedTo={isCreating ? { type: targetType, id: targetId, name: targetName } : undefined}
          onClose={() => {
            setOpenTask(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};
