/**
 * Timeline model for a record (Twenty: timeline-activities). Ours (glue): the rows come from this app's `activities`
 * table plus linked calendar events; Twenty's rows come from its GraphQL timeline.
 */
import type { Activity } from '../../types';

export type TimelineKind = 'note' | 'task' | 'call' | 'meeting' | 'email' | 'deal' | 'event' | 'file' | 'ai' | 'other';

export interface TimelineItem {
  id: string;
  kind: TimelineKind;
  title: string;
  description?: string;
  at: Date;
  who?: string;
  pinned?: boolean;
  /** present for rows backed by an `activities` row (notes can be edited/deleted) */
  activity?: Activity;
}

export const kindOf = (type: string): TimelineKind => {
  if (/^note|comment/.test(type)) return 'note';
  if (/email/.test(type)) return 'email';
  if (/call/.test(type)) return 'call';
  if (/meeting/.test(type)) return 'meeting';
  if (/^deal/.test(type)) return 'deal';
  if (/file/.test(type)) return 'file';
  if (/^ai_/.test(type)) return 'ai';
  if (/task|subtask|reminder/.test(type)) return 'task';
  return 'other';
};

export const KIND_LABEL: Record<TimelineKind, string> = {
  note: 'Notes', task: 'Tasks', call: 'Calls', meeting: 'Meetings', email: 'Emails', deal: 'Deals', event: 'Events', file: 'Files', ai: 'AI', other: 'Other'
};

export const fromActivity = (a: Activity): TimelineItem => ({
  id: `a:${a.id}`,
  kind: kindOf(a.type),
  title: a.title,
  description: a.description,
  at: a.createdAt,
  who: a.userName,
  pinned: !!a.metadata?.pinned,
  activity: a
});

export interface LinkedEvent { id: string; title?: string; startsAt: string; description?: string }

export const fromLinkedEvent = (e: LinkedEvent): TimelineItem => ({
  id: `e:${e.id}`,
  kind: 'event',
  title: e.title ?? 'Calendar event',
  description: e.description,
  at: new Date(e.startsAt)
});

/** Newest first; pinned notes are listed separately by the caller, not reordered here. */
export const mergeTimeline = (activities: Activity[], events: LinkedEvent[] = []): TimelineItem[] =>
  [...activities.map(fromActivity), ...events.map(fromLinkedEvent)].sort((a, b) => +b.at - +a.at);

export const filterTimeline = (items: TimelineItem[], kinds: TimelineKind[]): TimelineItem[] =>
  kinds.length === 0 ? items : items.filter((i) => kinds.includes(i.kind));

export interface MonthGroup { key: string; label: string; items: TimelineItem[] }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const groupTimelineByMonth = (items: TimelineItem[]): MonthGroup[] => {
  const groups = new Map<string, MonthGroup>();
  for (const item of items) {
    const key = `${item.at.getFullYear()}-${String(item.at.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, { key, label: `${MONTHS[item.at.getMonth()]} ${item.at.getFullYear()}`, items: [] });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
};

export const kindsPresent = (items: TimelineItem[]): TimelineKind[] => [...new Set(items.map((i) => i.kind))];
