import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { filterTimeline, groupTimelineByMonth, kindOf, mergeTimeline, kindsPresent } from './timeline';
import { MarkdownLite } from './markdownLite';

const act = (id: string, type: string, at: Date, extra: any = {}) => ({ id, type, title: id, userId: 'u', userName: 'You', entityType: 'contact', entityId: 'c', createdAt: at, ...extra }) as any;

describe('timeline model', () => {
  it('classifies activity types', () => {
    expect(['note_added', 'email_sent', 'call_made', 'meeting_held', 'deal_moved', 'file_uploaded', 'ai_insight_generated', 'task_completed', 'weird'].map(kindOf)).toEqual([
      'note', 'email', 'call', 'meeting', 'deal', 'file', 'ai', 'task', 'other'
    ]);
  });
  it('merges activities and linked events newest first', () => {
    const items = mergeTimeline([act('a', 'note_added', new Date(2026, 9, 1)), act('b', 'email_sent', new Date(2026, 10, 5))], [{ id: 'e', title: 'Call', startsAt: new Date(2026, 9, 20).toISOString() }]);
    expect(items.map((i) => i.id)).toEqual(['a:b', 'e:e', 'a:a']);
  });
  it('filters by kind (empty = all) and lists kinds present', () => {
    const items = mergeTimeline([act('a', 'note_added', new Date()), act('b', 'email_sent', new Date())]);
    expect(filterTimeline(items, ['note']).map((i) => i.kind)).toEqual(['note']);
    expect(filterTimeline(items, [])).toHaveLength(2);
    expect(kindsPresent(items).sort()).toEqual(['email', 'note']);
  });
  it('groups by month, newest month first', () => {
    const items = mergeTimeline([act('a', 'note_added', new Date(2026, 9, 31)), act('b', 'note_added', new Date(2026, 10, 1)), act('c', 'note_added', new Date(2026, 10, 20))]);
    const groups = groupTimelineByMonth(items);
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([['November 2026', 2], ['October 2026', 1]]);
  });
});

describe('MarkdownLite', () => {
  it('renders bold, italic, code, links and bullet lists', () => {
    render(<MarkdownLite text={'**Hi** *there* `x`\n- one\n- two\n[docs](https://example.com)'} />);
    expect(screen.getByText('Hi').tagName).toBe('STRONG');
    expect(screen.getByText('there').tagName).toBe('EM');
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['one', 'two']);
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', 'https://example.com');
  });
  it('never turns text into markup or runs javascript: links', () => {
    const { container } = render(<MarkdownLite text={'<img src=x onerror=alert(1)> [bad](javascript:alert(1))'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
