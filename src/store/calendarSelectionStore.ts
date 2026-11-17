/**
 * Glue (ours): record selection for the calendar.
 * Behaviour follows twentyhq/twenty's record calendar (RecordCalendar.tsx / useOpenRecordContextMenu):
 * clicking a card selects it, a right-click selects the record before opening its menu, Escape clears the selection.
 * Twenty keeps this in jotai + a hotkey scope; here it is a small zustand store.
 */
import { create } from 'zustand';

interface CalendarSelectionState {
  selectedKeys: string[];
  select: (key: string, additive?: boolean) => void;
  clear: () => void;
  isSelected: (key: string) => boolean;
}

export const useCalendarSelectionStore = create<CalendarSelectionState>((set, get) => ({
  selectedKeys: [],
  select: (key, additive = false) =>
    set((state) => {
      if (!additive) return { selectedKeys: [key] };
      return {
        selectedKeys: state.selectedKeys.includes(key)
          ? state.selectedKeys.filter((k) => k !== key)
          : [...state.selectedKeys, key]
      };
    }),
  clear: () => set({ selectedKeys: [] }),
  isSelected: (key) => get().selectedKeys.includes(key)
}));
