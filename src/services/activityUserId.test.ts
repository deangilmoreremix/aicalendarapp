import { describe, it, expect, vi, beforeEach } from 'vitest';

const insert = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: (row: unknown) => {
        insert(row);
        return { select: () => ({ single: async () => ({ data: { id: 'a1', type: 'note_added', title: 't', created_at: new Date().toISOString(), metadata: {} }, error: null }) }) };
      }
    })
  }
}));

import { activityApi } from './api';

const base = { type: 'note_added', title: 't', description: 'd', userName: 'You', entityType: 'contact', entityId: 'e', metadata: {} } as const;

describe('activityApi.create user id', () => {
  beforeEach(() => insert.mockClear());

  it('stores the "current-user" placeholder as null (user_id is a uuid column)', async () => {
    await activityApi.create({ ...(base as any), userId: 'current-user' });
    expect(insert.mock.calls[0][0].user_id).toBeNull();
  });

  it('keeps a real uuid', async () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    await activityApi.create({ ...(base as any), userId: id });
    expect(insert.mock.calls[0][0].user_id).toBe(id);
  });
});
