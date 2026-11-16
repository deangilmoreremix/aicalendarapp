/**
 * Ours (glue): "open this record" from anywhere (favorites, command menu). One host component in App renders the
 * matching details view, so callers only say which record they want.
 */
import { create } from 'zustand';

export type OpenableRecordType = 'task' | 'deal' | 'contact' | 'event';
export type OpenTarget = { type: OpenableRecordType; id: string } | null;

interface OpenRecordState {
  target: OpenTarget;
  open: (type: OpenableRecordType, id: string) => void;
  close: () => void;
}

export const useOpenRecordStore = create<OpenRecordState>((set) => ({
  target: null,
  open: (type, id) => set({ target: { type, id } }),
  close: () => set({ target: null })
}));
