/** Ours (glue): toggle a record's favorite flag through the store that owns it. */
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import type { UnifiedCalendarRecord } from './unifiedCalendarRecords';

export const canFavorite = (record: Pick<UnifiedCalendarRecord, 'type'>) => record.type !== 'event';

export const toggleFavorite = async (record: Pick<UnifiedCalendarRecord, 'type' | 'id' | 'isFavorite'>): Promise<boolean> => {
  const isFavorite = !record.isFavorite;
  switch (record.type) {
    case 'task':
      return useTaskStore.getState().rescheduleTask(record.id, { isFavorite });
    case 'deal':
      await useDealStore.getState().updateDeal(record.id, { isFavorite });
      return !useDealStore.getState().error;
    case 'contact':
      await useContactStore.getState().updateContact(record.id, { isFavorite });
      return !useContactStore.getState().error;
    default:
      return false;
  }
};
