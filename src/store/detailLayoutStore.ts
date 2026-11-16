/**
 * Ours (glue): which layout each kind of details view uses. "full" is the view as it always was; "compact" keeps only
 * the key facts. The choice is remembered per record type in this browser. Twenty's page layouts are a much larger,
 * metadata-driven system with no portable code here, so this is the small version of the same idea.
 */
import { create } from 'zustand';

export type DetailLayout = 'compact' | 'full';
export type DetailLayoutKind = 'task' | 'deal' | 'contact' | 'event';

const STORAGE_KEY = 'ai-calendar:detail-layouts';
const DEFAULTS: Record<DetailLayoutKind, DetailLayout> = { task: 'full', deal: 'full', contact: 'full', event: 'full' };

// Storage can be missing or throw (private windows, blocked site data): the layout then just isn't remembered.
const read = (): Record<DetailLayoutKind, DetailLayout> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Record<DetailLayoutKind, DetailLayout>>;
    const out = { ...DEFAULTS };
    for (const kind of Object.keys(DEFAULTS) as DetailLayoutKind[]) {
      if (parsed[kind] === 'compact' || parsed[kind] === 'full') out[kind] = parsed[kind]!;
    }
    return out;
  } catch {
    return { ...DEFAULTS };
  }
};

const write = (layouts: Record<DetailLayoutKind, DetailLayout>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  } catch {
    /* not remembered */
  }
};

interface DetailLayoutState {
  layouts: Record<DetailLayoutKind, DetailLayout>;
  setLayout: (kind: DetailLayoutKind, layout: DetailLayout) => void;
}

export const useDetailLayoutStore = create<DetailLayoutState>((set, get) => ({
  layouts: read(),
  setLayout: (kind, layout) => {
    const layouts = { ...get().layouts, [kind]: layout };
    set({ layouts });
    write(layouts);
  }
}));

export const useDetailLayout = (kind: DetailLayoutKind) =>
  [useDetailLayoutStore((s) => s.layouts[kind]), (layout: DetailLayout) => useDetailLayoutStore.getState().setLayout(kind, layout)] as const;
