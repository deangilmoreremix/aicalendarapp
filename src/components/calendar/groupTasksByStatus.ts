/**
 * Task grouping rule from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/tasks/components/TaskGroupsContent.tsx
 *   Object.entries(groupBy(tasks, ({ status }) => status)).sort(([statusA], [statusB]) => statusB.localeCompare(statusA))
 * Same rule here; lodash groupBy is replaced by the vendored upstream groupArrayItemsBy.
 */
import type { Task } from '../../types';
import { groupArrayItemsBy } from '../../vendor/twenty/calendar/shared/array/groupArrayItemsBy';

export const groupTasksByStatus = (tasks: Task[]): [Task['status'], Task[]][] =>
  (Object.entries(groupArrayItemsBy(tasks, ({ status }) => status)) as [Task['status'], Task[]][]).sort(([statusA], [statusB]) =>
    statusB.localeCompare(statusA)
  );

/** Same semantics as upstream useCompleteTask: complete -> done status, uncomplete -> back to the open status. */
export const completionUpdate = (value: boolean): Partial<Task> =>
  value
    ? { status: 'completed', completed: true, completedAt: new Date() }
    : { status: 'pending', completed: false, completedAt: undefined };
