import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scoreRecord, searchRecords, searchCommands, readRecent, rememberRecent, type Searchable } from './searchRecords';

const recs: Searchable[] = [
  { type: 'contact', id: '1', title: 'Ada Lovelace', subtitle: 'TechCorp Solutions · CTO' },
  { type: 'deal', id: '2', title: 'TechCorp Solutions', subtitle: '$85,000 · negotiation' },
  { type: 'task', id: '3', title: 'Send proposal to TechCorp', subtitle: 'high' },
  { type: 'task', id: '4', title: 'Prepare demo', subtitle: 'urgent', favorite: true },
  { type: 'event', id: '5', title: 'Renewal call with Ada' }
];

describe('searchRecords', () => {
  it('needs every query word to match', () => {
    expect(searchRecords('ada call', recs).map((r) => r.id)).toEqual(['5']);
    expect(searchRecords('ada zzz', recs)).toEqual([]);
  });
  it('ranks starts-with above contains, and titles above subtitles', () => {
    const ids = searchRecords('tech', recs).map((r) => r.id);
    expect(ids[0]).toBe('2'); // title starts with "tech"
    expect(ids).toContain('1'); // subtitle match still found
    expect(ids.indexOf('2')).toBeLessThan(ids.indexOf('1'));
  });
  it('ignores case and accents', () => {
    expect(searchRecords('ÁDA', recs).map((r) => r.id)).toContain('1');
  });
  it('returns nothing for an empty query and honours the limit', () => {
    expect(searchRecords('  ', recs)).toEqual([]);
    expect(searchRecords('a', recs, 2)).toHaveLength(2);
  });
  it('gives favorites a small boost', () => {
    const a = scoreRecord('prepare', recs[3]);
    const b = scoreRecord('prepare', { ...recs[3], favorite: false });
    expect(a).toBe(b + 5);
  });
});

describe('searchCommands', () => {
  const cmds = [
    { id: 'a', label: 'New task', keywords: 'create todo', run: vi.fn() },
    { id: 'b', label: 'Toggle theme', keywords: 'dark light mode', run: vi.fn() }
  ];
  it('lists all commands for an empty query and matches labels and keywords', () => {
    expect(searchCommands('', cmds)).toHaveLength(2);
    expect(searchCommands('dark', cmds).map((c) => c.id)).toEqual(['b']);
    expect(searchCommands('new', cmds).map((c) => c.id)).toEqual(['a']);
  });
});

describe('recent items', () => {
  beforeEach(() => localStorage.clear());
  it('remembers the latest five, newest first, without duplicates', () => {
    for (const id of ['1', '2', '3', '4', '5', '6', '3']) rememberRecent({ type: 'task', id });
    expect(readRecent().map((r) => r.id)).toEqual(['3', '6', '5', '4', '2']);
  });
  it('survives unreadable or blocked storage', () => {
    localStorage.setItem('ai-calendar:command-recent', '{bad json');
    expect(readRecent()).toEqual([]);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => rememberRecent({ type: 'task', id: '1' })).not.toThrow();
    spy.mockRestore();
  });
});
