import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OpenAIKeySettings } from './OpenAIKeySettings';
import { getOpenAIAuth, saveOpenAIAuth } from '../lib/openaiKey';

beforeEach(() => localStorage.clear());

describe('OpenAI key settings', () => {
  it('says AI is off without a key, saves a key, and only shows its last four characters', () => {
    render(<OpenAIKeySettings />);
    expect(screen.getByText(/No key yet/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('OpenAI API key'), { target: { value: 'sk-abcdefgh1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save key' }));
    expect(getOpenAIAuth()?.apiKey).toBe('sk-abcdefgh1234');
    expect(screen.getByText(/ends in 1234/)).toBeInTheDocument();
    expect(screen.queryByDisplayValue('sk-abcdefgh1234')).toBeNull(); // the field is cleared
    expect(screen.queryByText(/sk-abcdefgh1234/)).toBeNull();
  });

  it('refuses a value that is not a key', () => {
    render(<OpenAIKeySettings />);
    fireEvent.change(screen.getByLabelText('OpenAI API key'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save key' }));
    expect(screen.getByText(/does not look like an OpenAI key/)).toBeInTheDocument();
    expect(getOpenAIAuth()).toBeNull();
  });

  it('keeps the saved key when only the model changes, and removes it on request', () => {
    saveOpenAIAuth({ apiKey: 'sk-abcdefgh1234' });
    render(<OpenAIKeySettings />);
    fireEvent.change(screen.getByLabelText('OpenAI model'), { target: { value: 'gpt-x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save key' }));
    expect(getOpenAIAuth()).toMatchObject({ apiKey: 'sk-abcdefgh1234', model: 'gpt-x' });
    fireEvent.click(screen.getByRole('button', { name: 'Remove key' }));
    expect(getOpenAIAuth()).toBeNull();
    expect(screen.getByText(/No key yet/)).toBeInTheDocument();
  });
});
