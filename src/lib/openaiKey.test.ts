import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearOpenAIAuth, getOpenAIAuth, hasOpenAIKey, isPlausibleKey, openaiHeaders, OpenAIKeyRequiredError, saveOpenAIAuth, OPENAI_KEY_CHANGED } from './openaiKey';

beforeEach(() => {
  localStorage.clear();
});

describe('openaiKey (bring your own key)', () => {
  it('has no key until one is saved, and refuses to build headers without one', () => {
    expect(hasOpenAIKey()).toBe(false);
    expect(() => openaiHeaders()).toThrow(OpenAIKeyRequiredError);
  });

  it('saves a plausible key and builds the request headers, with optional model names', () => {
    expect(saveOpenAIAuth({ apiKey: ' sk-abcdefgh1234 ', model: 'gpt-x', imageModel: '' })).toBe(true);
    expect(getOpenAIAuth()).toEqual({ apiKey: 'sk-abcdefgh1234', model: 'gpt-x', imageModel: undefined });
    expect(openaiHeaders()).toEqual({ 'x-openai-key': 'sk-abcdefgh1234', 'x-openai-model': 'gpt-x' });
  });

  it('rejects something that is not a key', () => {
    expect(isPlausibleKey('hello world')).toBe(false);
    expect(saveOpenAIAuth({ apiKey: 'not-a-key' })).toBe(false);
    expect(hasOpenAIKey()).toBe(false);
  });

  it('removes the key and tells listeners', () => {
    saveOpenAIAuth({ apiKey: 'sk-abcdefgh1234' });
    const listener = vi.fn();
    window.addEventListener(OPENAI_KEY_CHANGED, listener);
    clearOpenAIAuth();
    expect(hasOpenAIKey()).toBe(false);
    expect(listener).toHaveBeenCalled();
    window.removeEventListener(OPENAI_KEY_CHANGED, listener);
  });

  it('works when the browser blocks storage', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getOpenAIAuth()).toBeNull();
    expect(saveOpenAIAuth({ apiKey: 'sk-abcdefgh1234' })).toBe(false);
    get.mockRestore();
    set.mockRestore();
  });
});
