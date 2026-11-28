import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabase', () => ({ supabase: { functions: { invoke } } }));

import { aiApi } from './api';
import { saveOpenAIAuth, OpenAIKeyRequiredError } from '../lib/openaiKey';

beforeEach(() => {
  localStorage.clear();
  invoke.mockReset();
});

describe('AI calls use the user\'s own key', () => {
  it('refuse before any request when no key is saved', async () => {
    await expect(aiApi.composeEmail({ firstName: 'Ada' }, 'hi')).rejects.toBeInstanceOf(OpenAIKeyRequiredError);
    await expect(aiApi.generateTaskSuggestions('plan a call')).rejects.toBeInstanceOf(OpenAIKeyRequiredError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('send the key and model in headers', async () => {
    saveOpenAIAuth({ apiKey: 'sk-abcdefgh1234', model: 'gpt-x' });
    invoke.mockResolvedValue({ data: { text: 'Hello' }, error: null });
    expect(await aiApi.composeEmail({ firstName: 'Ada' }, 'hi')).toBe('Hello');
    expect(invoke).toHaveBeenCalledWith('email_compose', expect.objectContaining({ headers: { 'x-openai-key': 'sk-abcdefgh1234', 'x-openai-model': 'gpt-x' } }));
  });

  it("show the function's own message, such as a rejected key", async () => {
    saveOpenAIAuth({ apiKey: 'sk-abcdefgh1234' });
    const context = new Response(JSON.stringify({ error: 'OpenAI rejected your API key. Check the key in Settings.' }), { status: 500 });
    invoke.mockResolvedValue({ data: null, error: { message: 'Edge Function returned a non-2xx status code', context } });
    await expect(aiApi.composeEmail({}, 'x')).rejects.toThrow('rejected your API key');
  });
});
