/** Ours (glue): bulk actions on selected table rows, each applied through the store that owns the record type. */
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import type { TableObject } from '../../lib/recordFilters/fields';
import { completionUpdate } from '../calendar/groupTasksByStatus';

export type BulkAction =
  | { type: 'favorite'; value: boolean }
  | { type: 'delete' }
  | { type: 'set'; field: 'status' | 'stage'; value: string }
  | { type: 'complete' }
  | { type: 'addTag'; tag: string };

export interface BulkResult { done: number; failed: number }

const one = async (object: TableObject, id: string, action: BulkAction): Promise<boolean> => {
  switch (object) {
    case 'task': {
      const store = useTaskStore.getState();
      if (action.type === 'delete') {
        await store.deleteTask(id);
        return !useTaskStore.getState().error;
      }
      const task = store.tasks[id];
      if (!task) return false;
      if (action.type === 'favorite') return store.rescheduleTask(id, { isFavorite: action.value });
      if (action.type === 'complete') return store.rescheduleTask(id, completionUpdate(true));
      if (action.type === 'set' && action.field === 'status') {
        return store.rescheduleTask(id, action.value === 'completed' ? completionUpdate(true) : { status: action.value as never, completed: false });
      }
      if (action.type === 'addTag') return store.rescheduleTask(id, { tags: [...new Set([...(task.tags ?? []), action.tag])] });
      return false;
    }
    case 'deal': {
      const store = useDealStore.getState();
      if (action.type === 'delete') {
        await store.deleteDeal(id);
        return !useDealStore.getState().error;
      }
      if (!store.deals[id]) return false;
      if (action.type === 'favorite') await store.updateDeal(id, { isFavorite: action.value });
      else if (action.type === 'set' && action.field === 'stage') await store.updateDeal(id, { stage: action.value as never });
      else return false;
      return !useDealStore.getState().error;
    }
    case 'contact': {
      const store = useContactStore.getState();
      if (action.type === 'delete') {
        await store.deleteContact(id);
        return !useContactStore.getState().error;
      }
      const contact = store.contacts[id];
      if (!contact) return false;
      if (action.type === 'favorite') await store.updateContact(id, { isFavorite: action.value });
      else if (action.type === 'set' && action.field === 'status') await store.updateContact(id, { status: action.value as never });
      else if (action.type === 'addTag') await store.updateContact(id, { tags: [...new Set([...(contact.tags ?? []), action.tag])] });
      else return false;
      return !useContactStore.getState().error;
    }
  }
};

/** Runs the action for every id; one failure does not stop the rest. */
export const applyBulk = async (object: TableObject, ids: string[], action: BulkAction): Promise<BulkResult> => {
  const results = await Promise.all(ids.map((id) => one(object, id, action).catch(() => false)));
  const done = results.filter(Boolean).length;
  return { done, failed: results.length - done };
};
