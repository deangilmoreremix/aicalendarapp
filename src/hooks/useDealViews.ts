import { useEffect, useMemo } from 'react';
import { useDealStore } from '../store/dealStore';
import type { Deal } from '../types';

/** Display-oriented view of a stored deal (dates as ISO strings). */
export interface DealView extends Omit<Deal, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export const toDealView = (deal: Deal): DealView => ({
  ...deal,
  createdAt: new Date(deal.createdAt).toISOString(),
  updatedAt: new Date(deal.updatedAt).toISOString()
});

/** Real deals from Supabase via the deal store (loads once when empty). */
export function useDealViews(enabled = true): { deals: DealView[]; isLoading: boolean; error: string | null } {
  const { deals, isLoading, error, loadDeals } = useDealStore();
  const isEmpty = Object.keys(deals).length === 0;

  useEffect(() => {
    if (enabled && isEmpty && !isLoading && !error) {
      loadDeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const views = useMemo(() => Object.values(deals).map(toDealView), [deals]);
  return { deals: views, isLoading, error };
}
