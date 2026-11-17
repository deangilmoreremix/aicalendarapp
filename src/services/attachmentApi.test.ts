import { describe, it, expect, vi, beforeEach } from 'vitest';

const sb = vi.hoisted(() => ({
  uploaded: [] as any[], removed: [] as string[][], inserted: [] as any[], deletedIds: [] as any[],
  uploadError: null as any, insertError: null as any, signed: { data: { signedUrl: 'https://s/x' }, error: null } as any
}));
vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: async (path: string, file: File, opts: any) => (sb.uploaded.push({ path, file, opts }), { error: sb.uploadError }),
        remove: async (paths: string[]) => (sb.removed.push(paths), { error: null }),
        createSignedUrl: async (path: string, secs: number, opts: any) => ((sb as any).lastSign = { path, secs, opts }, sb.signed)
      })
    },
    from: () => ({
      insert: (row: any) => ({ select: () => ({ single: async () => (sb.inserted.push(row), sb.insertError ? { data: null, error: sb.insertError } : { data: { id: 'new', created_at: new Date().toISOString(), ...row }, error: null }) }) }),
      select: () => ({ in: async () => ({ data: [{ id: 'x1', storage_path: 'p1' }], error: null }), eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
      delete: () => ({ eq: async (_c: string, id: string) => (sb.deletedIds.push(id), { error: null }), in: async (_c: string, ids: string[]) => (sb.deletedIds.push(...ids), { error: null }) })
    })
  }
}));

import { attachmentApi, safeStorageName, MAX_ATTACHMENT_BYTES } from './api';

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name, { type: 'text/plain' });
beforeEach(() => Object.assign(sb, { uploaded: [], removed: [], inserted: [], deletedIds: [], uploadError: null, insertError: null }));

describe('safeStorageName', () => {
  it('keeps storage keys to safe characters', () => {
    expect(safeStorageName('Résumé final (v2).pdf')).toBe('Resume_final_v2_.pdf');
    expect(safeStorageName('../../etc/passwd')).toBe('_.._etc_passwd');
    expect(safeStorageName('   ')).toBe('_');
    expect(safeStorageName('')).toBe('file');
  });
});

describe('attachmentApi.upload', () => {
  it('stores the file under type/id and records its metadata with the readable name', async () => {
    const saved = await attachmentApi.upload('deal', 'd1', file('Q4 plan.txt', 5));
    expect(sb.uploaded[0].path).toMatch(/^deal\/d1\/[0-9a-f-]{36}-Q4_plan\.txt$/);
    expect(sb.inserted[0]).toMatchObject({ entity_type: 'deal', entity_id: 'd1', name: 'Q4 plan.txt', size: 5 });
    expect(saved.name).toBe('Q4 plan.txt');
  });
  it('refuses empty and oversized files before uploading anything', async () => {
    await expect(attachmentApi.upload('deal', 'd1', file('e.txt', 0))).rejects.toThrow('empty');
    await expect(attachmentApi.upload('deal', 'd1', { name: 'big.bin', size: MAX_ATTACHMENT_BYTES + 1, type: '' } as File)).rejects.toThrow('larger than 25 MB');
    expect(sb.uploaded).toHaveLength(0);
  });
  it('removes the stored file again when the metadata row cannot be saved', async () => {
    sb.insertError = new Error('db down');
    await expect(attachmentApi.upload('task', 't1', file('a.txt'))).rejects.toThrow('db down');
    expect(sb.removed).toHaveLength(1);
    expect(sb.removed[0][0]).toBe(sb.uploaded[0].path);
  });
  it('surfaces a storage failure without writing metadata', async () => {
    sb.uploadError = new Error('storage off');
    await expect(attachmentApi.upload('task', 't1', file('a.txt'))).rejects.toThrow('storage off');
    expect(sb.inserted).toHaveLength(0);
  });
});

describe('download, remove, bulk remove', () => {
  it('asks for a one-minute link that downloads under the original name', async () => {
    expect(await attachmentApi.getDownloadUrl('p/1', 'My file.pdf')).toBe('https://s/x');
    expect((sb as any).lastSign).toEqual({ path: 'p/1', secs: 60, opts: { download: 'My file.pdf' } });
  });
  it('deletes the object and then the row', async () => {
    await attachmentApi.remove({ id: 'a1', storagePath: 'p/1' });
    expect(sb.removed[0]).toEqual(['p/1']);
    expect(sb.deletedIds).toContain('a1');
  });
  it('removes the files of deleted records (and nothing when there are none)', async () => {
    await attachmentApi.removeForEntities(['d1', 'c1']);
    expect(sb.removed[0]).toEqual(['p1']);
    expect(sb.deletedIds).toContain('x1');
    sb.removed = [];
    await attachmentApi.removeForEntities([]);
    expect(sb.removed).toHaveLength(0);
  });
});
