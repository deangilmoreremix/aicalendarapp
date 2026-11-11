import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Audit tests for every Supabase edge function handler: CORS preflight, input validation,
 * behaviour without an OpenAI key (fallback or 503), the exact request sent to OpenAI, and error handling.
 * Handlers are imported for real; Deno.serve, Deno.env and fetch are stubbed.
 */
type Handler = (req: Request) => Promise<Response>;

const env: Record<string, string | undefined> = {};
let handler: Handler;
const fetchMock = vi.fn();

const load = async (name: string): Promise<Handler> => {
  vi.resetModules();
  let captured: Handler | undefined;
  (globalThis as any).Deno = {
    env: { get: (k: string) => env[k] },
    serve: (h: Handler) => {
      captured = h;
    }
  };
  await import(`./${name}/index.ts`);
  if (!captured) throw new Error(`${name} did not register a handler`);
  return captured;
};

const post = (body: unknown) => new Request('http://x/fn', { method: 'POST', body: JSON.stringify(body) });
const openaiText = (text: string) => ({ ok: true, status: 200, json: async () => ({ output_text: text }) });
const lastOpenAIBody = () => JSON.parse(fetchMock.mock.calls.at(-1)![1].body);

beforeEach(() => {
  for (const k of Object.keys(env)) delete env[k];
  fetchMock.mockReset();
  (globalThis as any).fetch = fetchMock;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const ALL = [
  'ai_stream', 'contacts_enrich', 'contacts_image', 'contacts_score', 'email_compose', 'generate_ai_insights',
  'generate_deal_suggestions', 'generate_meeting_agenda', 'generate_task_suggestions', 'meetings_plan',
  'optimize_meeting_time', 'predict_deal_success', 'research_web'
];

describe.each(ALL)('%s', (name) => {
  it('answers the CORS preflight', async () => {
    handler = await load(name);
    const res = await handler(new Request('http://x/fn', { method: 'OPTIONS' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('fallbacks without OPENAI_API_KEY', () => {
  it('email_compose returns a plain-text draft', async () => {
    handler = await load('email_compose');
    const body = await (await handler(post({ recipient: { firstName: 'Ada' }, context: 'Follow up' }))).json();
    expect(body.text).toMatch(/^Hi Ada/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('contacts_enrich (text) says no key is configured and never invents profile URLs', async () => {
    handler = await load('contacts_enrich');
    const body = await (await handler(post({ contact: { firstName: 'Ada', lastName: 'L', company: 'X' } }))).json();
    expect(body.text).toContain('No enrichment API key');
    expect(body.text).not.toMatch(/linkedin\.com/);
  });

  it('contacts_enrich (structured) and contacts_score refuse with 503 instead of faking data', async () => {
    handler = await load('contacts_enrich');
    const res = await handler(post({ contact: { name: 'Ada' }, format: 'structured' }));
    expect(res.status).toBe(503);
    handler = await load('contacts_score');
    expect((await handler(post({ contact: { name: 'Ada' } }))).status).toBe(503);
  });

  it('meetings_plan, research_web and generate_meeting_agenda return a usable default', async () => {
    handler = await load('meetings_plan');
    expect((await (await handler(post({ topic: 'Demo', duration: 45 }))).json()).text).toContain('Demo');
    handler = await load('research_web');
    expect((await (await handler(post({ query: 'acme' }))).json()).text).toContain('acme');
    handler = await load('generate_meeting_agenda');
    const agenda = await (await handler(post({ title: 'QBR' }))).json();
    expect(Array.isArray(agenda)).toBe(true);
    expect(agenda.length).toBeGreaterThanOrEqual(5);
  });

  it('optimize_meeting_time returns 3 future ISO dates', async () => {
    handler = await load('optimize_meeting_time');
    const times: string[] = await (await handler(post({ attendee_ids: ['a'], duration: 30 }))).json();
    expect(times).toHaveLength(3);
    times.forEach((t) => expect(Date.parse(t)).toBeGreaterThan(Date.now()));
  });

  it('predict_deal_success returns a bounded number', async () => {
    handler = await load('predict_deal_success');
    const n = await (await handler(post({ contact_id: 'c1', deal_value: 120000 }))).json();
    expect(n).toBeGreaterThanOrEqual(10);
    expect(n).toBeLessThanOrEqual(95);
  });

  it('generate_ai_insights returns the fallback insight list', async () => {
    handler = await load('generate_ai_insights');
    const insights = await (await handler(post({ contacts: [{ interest_level: 'hot' }, { ai_score: 90 }] }))).json();
    expect(insights[0].description).toContain('2 contacts');
  });

  it('generate_task_suggestions falls back to rules and marks urgent prompts', async () => {
    handler = await load('generate_task_suggestions');
    const out = await (await handler(post({ prompt: 'Urgent: email the client about renewal' }))).json();
    expect(out[0].priority).toBe('urgent');
    expect(out[0].category).toBe('email');
  });

  it('ai_stream and contacts_image answer 503 without a key', async () => {
    handler = await load('ai_stream');
    expect((await handler(post({ operation: 'web-research', query: 'x' }))).status).toBe(503);
    handler = await load('contacts_image');
    expect((await handler(post({ contact: { name: 'Ada' } }))).status).toBe(503);
  });
});

describe('validation', () => {
  beforeEach(() => {
    env.OPENAI_API_KEY = 'sk-test';
  });

  it.each([
    ['research_web', {}],
    ['optimize_meeting_time', { attendee_ids: [] }],
    ['predict_deal_success', {}],
    ['generate_task_suggestions', { prompt: 'hi' }],
    ['generate_task_suggestions', { prompt: 'x'.repeat(1001) }],
    ['contacts_score', {}],
    ['contacts_image', { contact: {} }]
  ])('%s rejects invalid input %j', async (name, body) => {
    handler = await load(name);
    const res = await handler(post(body));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect((await res.json()).error).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ai_stream rejects unknown operations with 400', async () => {
    handler = await load('ai_stream');
    expect((await handler(post({ operation: 'nope' }))).status).toBe(400);
  });
});

describe('OpenAI Responses requests (with a key)', () => {
  beforeEach(() => {
    env.OPENAI_API_KEY = 'sk-test';
  });

  it('predict_deal_success sends a strict json_schema request to /v1/responses and clamps the result', async () => {
    fetchMock.mockResolvedValue(openaiText(JSON.stringify({ probability: 250 })));
    handler = await load('predict_deal_success');
    const n = await (await handler(post({ contact_id: 'c1', deal_value: 5 }))).json();
    expect(n).toBe(95);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
    const sent = lastOpenAIBody();
    expect(sent.model).toBe('gpt-6-astra');
    expect(sent.text.format).toMatchObject({ type: 'json_schema', strict: true });
    expect(sent).not.toHaveProperty('temperature');
    expect(sent).not.toHaveProperty('messages');
  });

  it('honours OPENAI_MODEL', async () => {
    env.OPENAI_MODEL = 'gpt-custom';
    fetchMock.mockResolvedValue(openaiText('hello'));
    handler = await load('email_compose');
    await handler(post({ recipient: {}, context: 'x' }));
    expect(lastOpenAIBody().model).toBe('gpt-custom');
  });

  it('email_compose returns the model text; an OpenAI error falls back to the template', async () => {
    fetchMock.mockResolvedValueOnce(openaiText('Dear Ada, ...'));
    handler = await load('email_compose');
    expect((await (await handler(post({ recipient: { firstName: 'Ada' }, context: 'x' }))).json()).text).toBe('Dear Ada, ...');
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: { message: 'bad key' } }) });
    const res = await (await handler(post({ recipient: { firstName: 'Ada' }, context: 'x' }))).json();
    expect(res.text).toMatch(/^Hi Ada/);
  });

  it('research_web enables web_search and returns citations', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output: [
          { type: 'web_search_call', action: { sources: [{ url: 'https://a.com', title: 'A' }] } },
          { type: 'message', content: [{ type: 'output_text', text: 'brief', annotations: [] }] }
        ]
      })
    });
    handler = await load('research_web');
    const body = await (await handler(post({ query: 'acme' }))).json();
    expect(body.text).toBe('brief');
    expect(lastOpenAIBody().tools).toEqual([{ type: 'web_search' }]);
    expect(body.citations).toEqual(expect.any(Array));
  });

  it('contacts_enrich (structured) forces web search, returns the schema fields and sources', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output: [
          { type: 'web_search_call', action: { sources: [{ url: 'https://a.com', title: 'A' }] } },
          { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ title: 'CTO', company: 'X', confidence: 80 }), annotations: [] }] }
        ]
      })
    });
    handler = await load('contacts_enrich');
    const body = await (await handler(post({ contact: { name: 'Ada', email: 'ada@x.io' }, format: 'structured' }))).json();
    expect(body).toMatchObject({ title: 'CTO', company: 'X', confidence: 80 });
    expect(body.sources).toEqual([{ url: 'https://a.com', title: 'A' }]);
    const sent = lastOpenAIBody();
    expect(sent.tool_choice).toBe('required');
    expect(sent.include).toContain('web_search_call.action.sources');
    expect(sent.input).toContain('x.io');
  });

  it('contacts_enrich (structured) surfaces upstream errors as 502', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: 'rate limited' } }) });
    handler = await load('contacts_enrich');
    const res = await handler(post({ contact: { name: 'Ada' }, format: 'structured' }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('rate limited');
  });

  it('contacts_score clamps every score to 0-100', async () => {
    fetchMock.mockResolvedValue(
      openaiText(JSON.stringify({ score: 140, reasoning: 'r', nextBestAction: 'Call', fitScore: -5, engagementScore: 50.4, conversionProbability: 101, urgencyScore: 0 }))
    );
    handler = await load('contacts_score');
    const body = await (await handler(post({ contact: { name: 'Ada' } }))).json();
    expect(body).toMatchObject({ score: 100, fitScore: 0, engagementScore: 50, conversionProbability: 100, urgencyScore: 0, nextBestAction: 'Call' });
  });

  it('generate_ai_insights maps the model output and passes deals and tasks along', async () => {
    fetchMock.mockResolvedValue(
      openaiText(JSON.stringify({ insights: [{ type: 'risk', title: 'Stale', description: 'd', confidence: 70, suggestedActions: ['Call'], category: 'deals' }] }))
    );
    handler = await load('generate_ai_insights');
    const out = await (await handler(post({ contacts: [{ name: 'A' }], deals: [{ company: 'X' }], tasks: [{ title: 'T' }] }))).json();
    expect(out[0]).toMatchObject({ type: 'risk', category: 'deals', actionable: true });
    expect(lastOpenAIBody().input).toContain('"deals"');
  });

  it('generate_task_suggestions returns structured suggestions and null due dates become undefined', async () => {
    fetchMock.mockResolvedValue(
      openaiText(JSON.stringify({ suggestions: [{ id: '1', title: 'T', description: 'd', priority: 'high', suggestedDueDate: null, estimatedDuration: 30, subtasks: [], tags: [], category: 'call', type: 'call', reasoning: 'r', confidence: 90 }] }))
    );
    handler = await load('generate_task_suggestions');
    const out = await (await handler(post({ prompt: 'Call the client tomorrow' }))).json();
    expect(out[0].title).toBe('T');
    expect(out[0].suggestedDueDate).toBeUndefined();
  });

  it('generate_meeting_agenda and optimize_meeting_time return arrays', async () => {
    fetchMock.mockResolvedValueOnce(openaiText(JSON.stringify({ items: ['Intro', 'Demo'] })));
    handler = await load('generate_meeting_agenda');
    expect(await (await handler(post({ title: 'QBR', attendees: [] }))).json()).toEqual(['Intro', 'Demo']);
    const soon = new Date(Date.now() + 86400000).toISOString();
    fetchMock.mockResolvedValueOnce(openaiText(JSON.stringify({ times: [soon, 'not a date'] })));
    handler = await load('optimize_meeting_time');
    expect(await (await handler(post({ attendee_ids: ['a'], duration: 30 }))).json()).toEqual([soon]);
  });

  it('ai_stream streams SSE content events and a final done event', async () => {
    const events = [
      'data: {"type":"response.output_text.delta","delta":"Hel"}\n\n',
      'data: {"type":"response.output_text.delta","delta":"lo"}\n\n',
      'data: {"type":"response.completed","response":{"output":[]}}\n\n'
    ];
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      body: new ReadableStream({ start(c) { events.forEach((e) => c.enqueue(new TextEncoder().encode(e))); c.close(); } })
    });
    handler = await load('ai_stream');
    const res = await handler(post({ operation: 'email-composition', recipient: { name: 'Ada' }, context: 'x' }));
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    const text = await res.text();
    expect(text).toContain('"content":"Hel"');
    expect(text).toContain('"done":true');
    expect(lastOpenAIBody().stream).toBe(true);
  });

  it('contacts_image generates an image and uploads it to the avatars bucket', async () => {
    env.SUPABASE_URL = 'http://sb';
    env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ b64_json: btoa('img') }] }) });
    const upload = vi.fn().mockResolvedValue({ error: null });
    (globalThis as any).__supabaseStub = () => ({
      storage: { from: (b: string) => ({ upload: (...a: unknown[]) => (b === 'avatars' ? upload(...a) : Promise.reject(new Error('wrong bucket'))), getPublicUrl: () => ({ data: { publicUrl: 'http://sb/avatars/x.webp' } }) }) }
    });
    handler = await load('contacts_image');
    const body = await (await handler(post({ contact: { id: 'c1', name: 'Ada Lovelace', title: 'CTO', company: 'X' } }))).json();
    expect(body.url).toBe('http://sb/avatars/x.webp');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/images/generations');
    expect(lastOpenAIBody()).toMatchObject({ model: 'gpt-image-2.6-flare', output_format: 'webp', size: '1024x1024' });
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^c1\/\d+\.webp$/), expect.any(Uint8Array), expect.objectContaining({ contentType: 'image/webp' }));
  });

  it('contacts_image reports a storage failure', async () => {
    env.SUPABASE_URL = 'http://sb';
    env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ b64_json: btoa('img') }] }) });
    (globalThis as any).__supabaseStub = () => ({ storage: { from: () => ({ upload: async () => ({ error: { message: 'bucket missing' } }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) } });
    handler = await load('contacts_image');
    const res = await handler(post({ contact: { id: 'c1', name: 'Ada' } }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('bucket missing');
  });
});

describe('generate_deal_suggestions', () => {
  it('validates the prompt and returns structured, bounded suggestions', async () => {
    handler = await load('generate_deal_suggestions');
    expect((await handler(post({ prompt: 'x' }))).status).toBe(500);
    const res = await handler(post({ prompt: 'Enterprise software deal for a big client, 100k budget' }));
    expect(res.status).toBe(200);
    const [s] = await res.json();
    expect(s).toMatchObject({ title: expect.any(String), priority: expect.stringMatching(/low|medium|high/) });
    expect(s.probability).toBeGreaterThanOrEqual(0);
    expect(s.probability).toBeLessThanOrEqual(100);
    expect(s.strategy.nextSteps.length).toBeGreaterThan(0);
  });
});
