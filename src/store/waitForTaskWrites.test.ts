import { describe, it, expect, vi } from 'vitest';

const api = vi.hoisted(() => ({ update: vi.fn(), remove: vi.fn(), create: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return { ...actual, taskApi: { ...actual.taskApi, update: api.update, delete: api.remove, create: api.create } };
});

import { useTaskStore, waitForTaskWrites, getTaskWriteEpoch, taskWritesSettledSince } from './taskStore';

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

  it('updateTask waits for an earlier save of the same task, is counted as a pending write, and does not hold up other tasks', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const calls: { id: string; u: any; resolve: (v: any) => void; reject: (e: Error) => void }[] = [];
    api.update.mockImplementation((id: string, u: any) => new Promise((resolve, reject) => calls.push({ id, u, resolve, reject })));
    const base = (id: string) => ({ id, title: id, status: 'pending', completed: false, priority: 'low', tags: [] }) as any;
    useTaskStore.setState({ tasks: { t1: base('t1'), t2: base('t2') }, error: null });

    useTaskStore.getState().markTaskComplete('t1', true); // save 1 of t1, in flight
    const edit = useTaskStore.getState().updateTask('t1', { title: 'Edited' } as any); // must wait for it
    void useTaskStore.getState().updateTask('t2', { title: 'Other' } as any); // another task: starts at once
    await vi.waitFor(() => expect(calls.map((c) => `${c.id}:${Object.keys(c.u)[0]}`)).toEqual(['t1:completed', 't2:title']));

    let settled = false;
    void waitForTaskWrites().then(() => { settled = true; });
    calls[0].reject(new Error('down')); // the completion fails...
    await vi.waitFor(() => expect(calls).toHaveLength(3)); // ...then the edit is sent
    expect(calls[2]).toMatchObject({ id: 't1', u: { title: 'Edited' } });
    calls[1].resolve({ ...base('t2'), title: 'Other' });
    calls[2].resolve({ ...base('t1'), title: 'Edited' });
    await edit;
    await vi.waitFor(() => expect(settled).toBe(true));
    // the failed completion did not remove the edit that finished after it
    expect(useTaskStore.getState().tasks.t1.title).toBe('Edited');
  });

  it('an edit followed by a failing completion keeps the edit (the completion starts from the saved edit)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const calls: { u: any; resolve: (v: any) => void; reject: (e: Error) => void }[] = [];
    api.update.mockImplementation((_id: string, u: any) => new Promise((resolve, reject) => calls.push({ u, resolve, reject })));
    const base = { id: 't1', title: 'Old', status: 'pending', completed: false, priority: 'low', tags: [] } as any;
    useTaskStore.setState({ tasks: { t1: base }, error: null });
    const edit = useTaskStore.getState().updateTask('t1', { title: 'Edited' } as any);
    useTaskStore.getState().markTaskComplete('t1', true); // queued behind the edit
    calls[0].resolve({ ...base, title: 'Edited' });
    await edit;
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    calls[1].reject(new Error('completion failed'));
    await vi.waitFor(() => expect(useTaskStore.getState().tasks.t1.completed).toBe(false));
    expect(useTaskStore.getState().tasks.t1.title).toBe('Edited'); // the edit survives the failed completion
  });

  it('a task deleted while its completion is still saving stays deleted when the completion fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let failCompletion!: (e: Error) => void;
    api.update.mockImplementation(() => new Promise((_r, reject) => { failCompletion = reject; }));
    api.remove.mockResolvedValue(undefined);
    useTaskStore.setState({ tasks: { t1: { id: 't1', title: 'T', status: 'pending', completed: false, priority: 'low', tags: [] } as any }, error: null });
    useTaskStore.getState().markTaskComplete('t1', true);
    const deletion = useTaskStore.getState().deleteTask('t1');
    expect(api.remove).not.toHaveBeenCalled(); // waits for the completion save to settle
    failCompletion(new Error('down'));
    await deletion;
    expect(api.remove).toHaveBeenCalledWith('t1');
    expect(useTaskStore.getState().tasks.t1).toBeUndefined();
  });

  it('creating a task counts as a pending write until the new task is in the store', async () => {
    let finishCreate!: (t: any) => void;
    api.create.mockImplementation(() => new Promise((resolve) => { finishCreate = resolve; }));
    useTaskStore.setState({ tasks: {}, error: null });
    const epoch = getTaskWriteEpoch();
    const creation = useTaskStore.getState().createTask({ title: 'New' } as any);
    expect(taskWritesSettledSince(epoch)).toBe(false); // a read that started before this must be rejected
    finishCreate({ id: 'n1', title: 'New', status: 'pending', completed: false, priority: 'medium', tags: [] });
    await creation;
    expect(useTaskStore.getState().tasks.n1.title).toBe('New');
    expect(taskWritesSettledSince(epoch)).toBe(false); // the epoch moved, so an old read is still rejected
    await expect(waitForTaskWrites()).resolves.toBeUndefined();
  });
});
