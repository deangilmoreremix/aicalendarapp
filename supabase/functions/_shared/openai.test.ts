import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRequestBody, callResponses, callResponsesJson, extractCitations, extractText } from './openai.ts';

const g = globalThis as any;

const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data }) as Response;

describe('OpenAI Responses helper', () => {
  beforeEach(() => {
    const env: Record<string, string> = { OPENAI_API_KEY: 'sk-test' };
    g.Deno = { env: { get: (k: string) => env[k] } };
  });

  it('builds a Responses API request (no chat-completions fields)', () => {
    const body = buildRequestBody(
      { instructions: 'sys', input: 'hi', maxOutputTokens: 100, schema: { name: 'x', schema: { type: 'object' } }, webSearch: true },
      'gpt-6-astra',
    ) as any;
    expect(body.model).toBe('gpt-6-astra');
    expect(body.instructions).toBe('sys');
    expect(body.input).toBe('hi');
    expect(body.reasoning).toEqual({ effort: 'low' });
    expect(body.text.format).toMatchObject({ type: 'json_schema', name: 'x', strict: true });
    expect(body.tools).toEqual([{ type: 'web_search' }]);
    expect(body).not.toHaveProperty('messages');
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('max_tokens');
  });

  it('posts to /v1/responses with bearer auth and reads output_text', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({ output_text: 'hello' }));
    const { text } = await callResponses({ instructions: 'a', input: 'b', fetchImpl });
    expect(text).toBe('hello');
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer sk-test');
  });

  it('extracts text and citations from output items', () => {
    const data = {
      output: [
        { type: 'web_search_call' },
        { type: 'message', content: [{ type: 'output_text', text: 'A', annotations: [{ type: 'url_citation', url: 'https://e.com', title: 'E' }] }] },
      ],
    };
    expect(extractText(data)).toBe('A');
    expect(extractCitations(data)).toEqual([{ url: 'https://e.com', title: 'E' }]);
  });

  it('parses JSON output', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({ output_text: '{"a":1}' }));
    expect(await callResponsesJson({ instructions: 'a', input: 'b', fetchImpl })).toEqual({ a: 1 });
  });

  it('surfaces API errors instead of swallowing them', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: { message: 'bad key' } }) });
    await expect(callResponses({ instructions: 'a', input: 'b', fetchImpl })).rejects.toThrow('bad key');
  });

  it('throws when the key is missing', async () => {
    g.Deno = { env: { get: () => undefined } };
    await expect(callResponses({ instructions: 'a', input: 'b' })).rejects.toThrow('OPENAI_API_KEY');
  });
});

import { buildImageBody, callImages } from './openai.ts';

describe('OpenAI Images helper', () => {
  beforeEach(() => {
    const env: Record<string, string> = { OPENAI_API_KEY: 'sk-test' };
    (globalThis as any).Deno = { env: { get: (k: string) => env[k] } };
  });

  it('builds an images request body', () => {
    const body = buildImageBody({ prompt: 'p', safetyIdentifier: 'u1' }, 'gpt-image-2.6-flare');
    expect(body).toMatchObject({ model: 'gpt-image-2.6-flare', prompt: 'p', size: '1024x1024', quality: 'medium', output_format: 'webp', safety_identifier: 'u1' });
  });

  it('calls /v1/images/generations and decodes b64_json', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ b64_json: btoa('abc') }] }) });
    const out = await callImages({ prompt: 'p', fetchImpl: fetchImpl as any });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.openai.com/v1/images/generations');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).model).toBe('gpt-image-2.6-flare');
    expect(new TextDecoder().decode(out.bytes)).toBe('abc');
    expect(out.contentType).toBe('image/webp');
  });

  it('uses /v1/images/edits with reference images', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ b64_json: btoa('x') }] }) });
    await callImages({ prompt: 'p', referenceImages: [{ bytes: new Uint8Array([1]), type: 'image/png', name: 'a.png' }], fetchImpl: fetchImpl as any });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.openai.com/v1/images/edits');
  });

  it('surfaces image errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: 'moderation_blocked' } }) });
    await expect(callImages({ prompt: 'p', fetchImpl: fetchImpl as any })).rejects.toThrow('moderation_blocked');
  });
});
