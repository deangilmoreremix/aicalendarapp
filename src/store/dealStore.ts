import { create } from 'zustand';
import { Deal } from '../types';
import { dealApi } from '../services/api';

interface DealState {
  deals: Record<string, Deal>;
  isLoading: boolean;
  error: string | null;
}

interface DealActions {
  getDeal: (id: string) => Deal | undefined;
  createDeal: (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDeal: (id: string, dealData: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  loadDeals: () => Promise<void>;
  updateDealStage: (id: string, stage: Deal['stage'], notes?: string) => Promise<void>;
}

type DealStore = DealState & DealActions;

export const useDealStore = create<DealStore>((set, get) => ({
  deals: {},
  isLoading: false,
  error: null,

  getDeal: (id) => {
    return get().deals[id];
  },

  createDeal: async (dealData) => {
    set({ isLoading: true, error: null });
    try {
      const newDeal = await dealApi.create(dealData);
      set((state) => ({
        deals: { ...state.deals, [newDeal.id]: newDeal },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to create deal:', error);
      set({ error: 'Failed to create deal', isLoading: false });
    }
  },

  updateDeal: async (id, dealData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDeal = await dealApi.update(id, dealData);
      set((state) => ({
        deals: { ...state.deals, [id]: updatedDeal },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to update deal:', error);
      set({ error: 'Failed to update deal', isLoading: false });
    }
  },

  deleteDeal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dealApi.delete(id);
      set((state) => {
        const { [id]: deleted, ...remainingDeals } = state.deals;
        return {
          deals: remainingDeals,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('Failed to delete deal:', error);
      set({ error: 'Failed to delete deal', isLoading: false });
    }
  },

  loadDeals: async () => {
    set({ isLoading: true, error: null });
    try {
      const deals = await dealApi.getAll();
      const dealsMap = deals.reduce((acc, deal) => {
        acc[deal.id] = deal;
        return acc;
      }, {} as Record<string, Deal>);

      set({
        deals: dealsMap,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load deals:', error);
      set({ error: 'Failed to load deals', isLoading: false });
    }
  },

  updateDealStage: async (id, stage, notes) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDeal = await dealApi.updateStage(id, stage, notes);
      set((state) => ({
        deals: { ...state.deals, [id]: updatedDeal },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to update deal stage:', error);
      set({ error: 'Failed to update deal stage', isLoading: false });
    }
  },
}));