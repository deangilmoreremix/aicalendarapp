import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../services/api', async (orig) => {
  const actual = await orig<typeof import('../services/api')>();
  return { ...actual, taskApi: { ...actual.taskApi, update: api.update, getAll: vi.fn().mockResolvedValue([]) } };
});
vi.mock('../contexts/AIContext', () => {
  const ai = { generateTaskSuggestions: vi.fn(async () => []), generateInsights: vi.fn(async () => []), predictNextBestAction: vi.fn(async () => ''), isProcessing: false };
  return { useAI: () => ai, AIProvider: ({ children }: any) => <>{children}</> };
});

import { TaskDetailsModal } from './TaskDetailsModal';

const task = (over: object = {}) =>
  ({ id: 't1', title: 'Send proposal', description: '', priority: 'medium', status: 'pending', category: 'other', type: 'other', completed: false, tags: [], attachments: [], subtasks: [], dueDate: new Date(2031, 0, 5), createdAt: new Date(), isFavorite: false, ...over }) as any;

describe('TaskDetailsModal: draft is refreshed when Edit is pressed', () => {
  it('keeps a favorite toggled while viewing instead of saving the old copy', async () => {
    api.update.mockImplementation(async (_id: string, updates: object) => ({ ...task(), ...updates, created_at: new Date().toISOString() }));
    const { rerender } = render(<TaskDetailsModal task={task()} isOpen onClose={() => {}} />);
    // the store changed the task while the details were open (e.g. the favorite star)
    rerender(<TaskDetailsModal task={task({ isFavorite: true })} isOpen onClose={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Task' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Update Task' }));
    await waitFor(() => expect(api.update).toHaveBeenCalled());
    expect(api.update.mock.calls[0][1]).toMatchObject({ isFavorite: true });
  });
});
