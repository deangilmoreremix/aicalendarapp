import { describe, it, expect, vi } from 'vitest';

const api = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return { ...actual, taskApi: { ...actual.taskApi, update: api.update } };
});

import { useTaskStore, waitForTaskWrites } from './taskStore';

describe('waitForTaskWrites', () => {
  it('resolves at once when idle, and after the last save settles even when it fails', async () => {
    await expect(waitForTaskWrites()).resolves.toBeUndefined();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let fail!: (e: Error) => void;
    api.update.mockImplementation(() => new Promise((_resolve, reject) => { fail = reject; }));
    useTaskStore.setState({ tasks: { t1: { id: 't1', title: 'T', status: 'pending', completed: false, priority: 'low', tags: [] } as any }, error: null });
    useTaskStore.getState().markTaskComplete('t1', true);
    let done = false;
    void waitForTaskWrites().then(() => { done = true; });
    await Promise.resolve();
    expect(done).toBe(false);
    fail(new Error('down'));
    await vi.waitFor(() => expect(done).toBe(true));
  });
});
