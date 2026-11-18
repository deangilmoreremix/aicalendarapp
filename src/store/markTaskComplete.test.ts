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
});
