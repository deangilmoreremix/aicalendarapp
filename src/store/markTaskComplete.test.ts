import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return { ...actual, taskApi: { ...actual.taskApi, update: api.update } };
});

import { useTaskStore } from './taskStore';

const task = (over: object = {}) => ({ id: 't1', title: 'T', status: 'pending', completed: false, priority: 'low', tags: [], ...over }) as any;

describe('markTaskComplete', () => {
  beforeEach(() => {
    api.update.mockReset();
    api.update.mockImplementation(async (_id: string, u: any) => ({ ...task(), ...u, completedAt: u.completedAt ?? undefined }));
    useTaskStore.setState({ tasks: { t1: task() }, error: null });
  });

  it('saves the completion (not only the screen) and sets the completion time', async () => {
    useTaskStore.getState().markTaskComplete('t1', true);
    expect(useTaskStore.getState().tasks.t1.completed).toBe(true); // optimistic
    await vi.waitFor(() => expect(api.update).toHaveBeenCalled());
    expect(api.update).toHaveBeenCalledWith('t1', { completed: true, status: 'completed', completedAt: expect.any(Date) });
  });

  it('reopening clears the completion time in the database', async () => {
    useTaskStore.setState({ tasks: { t1: task({ completed: true, status: 'completed', completedAt: new Date() }) } });
    useTaskStore.getState().markTaskComplete('t1', false);
    await vi.waitFor(() => expect(api.update).toHaveBeenCalled());
    expect(api.update).toHaveBeenCalledWith('t1', { completed: false, status: 'pending', completedAt: null });
  });

  it('puts the task back when saving fails', async () => {
    api.update.mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useTaskStore.getState().markTaskComplete('t1', true);
    await vi.waitFor(() => expect(useTaskStore.getState().tasks.t1.completed).toBe(false));
  });

  it('runs saves of the same task one after another: complete, then reopen ends reopened even if the first save is slower', async () => {
    const calls: { u: any; resolve: (v: any) => void }[] = [];
    api.update.mockImplementation((_id: string, u: any) => new Promise((resolve) => calls.push({ u, resolve: () => resolve({ ...task(), ...u, completedAt: u.completedAt ?? undefined }) })));
    useTaskStore.getState().markTaskComplete('t1', true);
    useTaskStore.getState().markTaskComplete('t1', false);
    expect(api.update).toHaveBeenCalledTimes(1); // the second save waits for the first
    calls[0].resolve(null);
    await vi.waitFor(() => expect(api.update).toHaveBeenCalledTimes(2));
    expect(calls[1].u).toMatchObject({ completed: false, status: 'pending', completedAt: null });
    calls[1].resolve(null);
    await vi.waitFor(() => expect(useTaskStore.getState().tasks.t1.completed).toBe(false));
    expect(useTaskStore.getState().tasks.t1.status).toBe('pending');
  });

  it('when two saves in a row fail, the task ends as it was before either (each rollback starts from the state before its own save)', async () => {
    api.update.mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useTaskStore.getState().markTaskComplete('t1', true);
    useTaskStore.getState().markTaskComplete('t1', false);
    await vi.waitFor(() => expect(api.update).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(useTaskStore.getState().error).toBe('Failed to reschedule task'));
    await new Promise((r) => setTimeout(r, 10));
    expect(useTaskStore.getState().tasks.t1.completed).toBe(false);
    expect(useTaskStore.getState().tasks.t1.status).toBe('pending');
  });

  it('saves of different tasks do not wait for each other', async () => {
    useTaskStore.setState({ tasks: { t1: task(), t2: task({ id: 't2' }) } });
    api.update.mockImplementation(() => new Promise(() => {}));
    useTaskStore.getState().markTaskComplete('t1', true);
    useTaskStore.getState().markTaskComplete('t2', true);
    expect(api.update).toHaveBeenCalledTimes(2);
  });
});
