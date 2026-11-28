/**
 * Bring-your-own-key: the user's own OpenAI key (and optional model names) is kept only in this browser's
 * localStorage and sent with each AI request in headers. The server never stores it.
 */
const STORAGE_KEY = 'openai-byok';
export const OPENAI_KEY_CHANGED = 'openai-key:changed';

export interface OpenAIAuth {
  apiKey: string;
  model?: string;
  imageModel?: string;
}

export class OpenAIKeyRequiredError extends Error {
  readonly code = 'OPENAI_KEY_REQUIRED';
  constructor() {
    super('Add your OpenAI key in Settings to use AI features.');
    this.name = 'OpenAIKeyRequiredError';
  }
}

/** A key looks like `sk-...` with no spaces. */
export const isPlausibleKey = (value: string): boolean => /^sk-\S{8,300}$/.test(value.trim());

export const getOpenAIAuth = (): OpenAIAuth | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OpenAIAuth>;
    if (typeof parsed.apiKey !== 'string' || !isPlausibleKey(parsed.apiKey)) return null;
    return {
      apiKey: parsed.apiKey.trim(),
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : undefined,
      imageModel: typeof parsed.imageModel === 'string' && parsed.imageModel.trim() ? parsed.imageModel.trim() : undefined
    };
  } catch {
    return null;
  }
};

export const hasOpenAIKey = (): boolean => getOpenAIAuth() !== null;

/** Saves the key; returns false when it does not look like a key or the browser refuses storage. */
export const saveOpenAIAuth = (auth: OpenAIAuth): boolean => {
  if (!isPlausibleKey(auth.apiKey)) return false;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ apiKey: auth.apiKey.trim(), model: auth.model?.trim() || undefined, imageModel: auth.imageModel?.trim() || undefined })
    );
    window.dispatchEvent(new Event(OPENAI_KEY_CHANGED));
    return true;
  } catch {
    return false;
  }
};

export const clearOpenAIAuth = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: nothing to clear */
  }
  window.dispatchEvent(new Event(OPENAI_KEY_CHANGED));
};

/** Headers for an AI request. Throws OpenAIKeyRequiredError when the user has not added a key. */
export const openaiHeaders = (): Record<string, string> => {
  const auth = getOpenAIAuth();
  if (!auth) throw new OpenAIKeyRequiredError();
  return {
    'x-openai-key': auth.apiKey,
    ...(auth.model ? { 'x-openai-model': auth.model } : {}),
    ...(auth.imageModel ? { 'x-openai-image-model': auth.imageModel } : {})
  };
};
