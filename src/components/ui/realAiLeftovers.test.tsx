import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const api = vi.hoisted(() => ({ suggest: vi.fn(), score: vi.fn() }));
vi.mock('../../services/api', async (orig) => {
  const actual = await orig<typeof import('../../services/api')>();
  return { ...actual, aiApi: { ...actual.aiApi, generateTaskSuggestions: api.suggest, scoreContact: api.score } };
});
vi.mock('./UniversalAIAssistant', () => ({ UniversalAIAssistant: () => null }));

import { AddTaskModal } from './AddTaskModal';

beforeEach(() => {
  vi.clearAllMocks();
  api.suggest.mockResolvedValue([{ id: '1', title: 'Send the revised pricing deck', description: 'Share pricing and book a call.', priority: 'high', subtasks: [] }]);
});

describe('AddTaskModal AI writing is real', () => {
  const open = () => render(<AddTaskModal isOpen onClose={vi.fn()} onTaskCreated={vi.fn()} />);

  it('asks the real suggestion function (seeded with what is typed) and fills the field with its answer', async () => {
    open();
    fireEvent.change(screen.getByPlaceholderText(/task title/i), { target: { value: 'Follow up with Ada' } });
    fireEvent.click(screen.getByTitle('AI writing assistant for task title'));
    await waitFor(() => expect(api.suggest).toHaveBeenCalled());
    expect(api.suggest.mock.calls[0][0]).toContain('Follow up with Ada');
    expect(await screen.findByDisplayValue('Send the revised pricing deck')).toBeInTheDocument();
  });

  it('shows an error and leaves the field alone when the AI call fails', async () => {
    api.suggest.mockRejectedValue(new Error('down'));
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    open();
    fireEvent.change(screen.getByPlaceholderText(/task title/i), { target: { value: 'Keep me' } });
    fireEvent.click(screen.getByTitle('AI writing assistant for task title'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(screen.getByDisplayValue('Keep me')).toBeInTheDocument();
    alert.mockRestore();
  });
});
