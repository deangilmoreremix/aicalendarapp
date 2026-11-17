import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('../../lib/supabase', () => ({ supabase: { functions: { invoke } } }));

import { aiApi, clearContactScoreCache } from '../../services/api';

const ok = { data: { score: 80, reasoning: 'r', nextBestAction: 'Call', fitScore: 1, engagementScore: 2, conversionProbability: 3, urgencyScore: 4 }, error: null };

beforeEach(() => {
  invoke.mockReset();
  clearContactScoreCache();
});

describe('contact scoring cost', () => {
  it('shares one OpenAI scoring request between concurrent and repeat callers for the same contact', async () => {
    invoke.mockResolvedValue(ok);
    const c = { id: 'c1', name: 'Ada', title: 'CTO', company: 'X' } as any;
    const [a, b] = await Promise.all([aiApi.scoreContact(c), aiApi.scoreContact(c)]);
    await aiApi.scoreContact({ ...c });
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('requests again when the contact data changed', async () => {
    invoke.mockResolvedValue(ok);
    const c = { id: 'c1', name: 'Ada', title: 'CTO' } as any;
    await aiApi.scoreContact(c);
    await aiApi.scoreContact({ ...c, title: 'CEO' });
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: new Error('boom') }).mockResolvedValue({ data: { score: 5 }, error: null });
    await expect(aiApi.scoreContact({ id: 'z' })).rejects.toThrow('boom');
    await expect(aiApi.scoreContact({ id: 'z' })).resolves.toMatchObject({ score: 5 });
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('expires cached scores after 10 minutes', async () => {
    invoke.mockResolvedValue(ok);
    vi.useFakeTimers();
    await aiApi.scoreContact({ id: 'e' });
    vi.setSystemTime(Date.now() + 11 * 60 * 1000);
    await aiApi.scoreContact({ id: 'e' });
    vi.useRealTimers();
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
