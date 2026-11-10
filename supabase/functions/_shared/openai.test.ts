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
