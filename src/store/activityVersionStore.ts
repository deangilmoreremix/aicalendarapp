/** Ours: bumped whenever an activity is created/edited/deleted so open timelines and note lists reload. */
import { create } from 'zustand';

export const useActivityVersionStore = create<{ version: number; bump: () => void }>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 }))
}));
