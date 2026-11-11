import { describe, it, expect, vi, beforeEach } from 'vitest';

const sb = vi.hoisted(() => {
  const calls: any = {};
  const chain = (name: string) => ({
    select: (cols: string) => ({ eq: (c: string, v: string) => ({ maybeSingle: async () => ((calls.select = { name, cols, c, v }), calls.row ?? { data: null, error: null }) }) }),
    upsert: async (row: unknown) => ((calls.upsert = { name, row }), calls.upsertResult ?? { error: null })
  });
  return { calls, from: vi.fn(chain) };
});
vi.mock('../../lib/supabase', () => ({ supabase: { from: sb.from } }));

import { calendarEventApi } from '../../services/api';

beforeEach(() => {
  for (const k of Object.keys(sb.calls)) delete sb.calls[k];
});

describe('calendar settings storage (single row, works without sign-in)', () => {
  it('reads the single "default" row and defaults to SHARE_EVERYTHING when none exists', async () => {
    expect(await calendarEventApi.getSettings()).toEqual({ defaultVisibility: 'SHARE_EVERYTHING' });
    expect(sb.calls.select).toMatchObject({ name: 'calendar_settings', c: 'id', v: 'default' });
  });

  it('returns the stored visibility', async () => {
    sb.calls.row = { data: { default_visibility: 'METADATA' }, error: null };
    expect(await calendarEventApi.getSettings()).toEqual({ defaultVisibility: 'METADATA' });
  });

  it('upserts the same row id every time so repeated saves update instead of inserting', async () => {
    await calendarEventApi.setDefaultVisibility('METADATA' as any);
    await calendarEventApi.setDefaultVisibility('SHARE_EVERYTHING' as any);
    expect(sb.calls.upsert).toMatchObject({ name: 'calendar_settings', row: { id: 'default', default_visibility: 'SHARE_EVERYTHING' } });
  });

  it('surfaces a failed save', async () => {
    sb.calls.upsertResult = { error: new Error('denied') };
    await expect(calendarEventApi.setDefaultVisibility('METADATA' as any)).rejects.toThrow('denied');
  });
});
