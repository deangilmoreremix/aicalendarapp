/**
 * Record timeline (Twenty: timeline-activities). Typed rows grouped by month (collapsible), type filter chips and
 * "Load more". Rows come from the `activities` table plus calendar events linked to the record. Same card look as the
 * previous timeline; the additions are the month headers and the chips.
 */
import { useEffect, useMemo, useState } from 'react';
import { Brain, Calendar, CheckCircle, ChevronDown, ChevronRight, Clock, FileText, Handshake, Mail, Paperclip, Phone, Pin } from 'lucide-react';

import { activityApi, calendarEventApi, type CalendarTargetType } from '../../services/api';
import { useActivityVersionStore } from '../../store/activityVersionStore';
import { MarkdownLite } from '../../lib/timeline/markdownLite';
import {
  filterTimeline,
  groupTimelineByMonth,
  KIND_LABEL,
  kindsPresent,
  mergeTimeline,
  type LinkedEvent,
  type TimelineItem,
  type TimelineKind
} from '../../lib/timeline/timeline';

const ICONS: Record<TimelineKind, React.ReactNode> = {
  note: <FileText className="w-4 h-4" />,
  task: <CheckCircle className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  deal: <Handshake className="w-4 h-4" />,
  event: <Calendar className="w-4 h-4" />,
  file: <Paperclip className="w-4 h-4" />,
  ai: <Brain className="w-4 h-4" />,
  other: <Clock className="w-4 h-4" />
};

const PAGE_SIZE = 20;

export const RecordTimeline = ({
  entityId,
  entityType,
  title = 'Activity'
}: {
  entityId: string;
  /** when set (contact / deal / task), calendar events linked to the record are listed too */
  entityType?: CalendarTargetType;
  title?: string;
}) => {
  const version = useActivityVersionStore((s) => s.version);
  const [items, setItems] = useState<TimelineItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kinds, setKinds] = useState<TimelineKind[]>([]);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const events: Promise<LinkedEvent[]> = entityType
      ? calendarEventApi
          .getTimeline(entityType, entityId, 50, 0)
          .then((r) => r.timelineCalendarEvents.map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt, description: e.description })))
          .catch(() => [])
      : Promise.resolve([]);
    Promise.all([activityApi.getForEntity(entityId), events])
      .then(([activities, linked]) => !cancelled && setItems(mergeTimeline(activities, linked)))
      .catch((err) => {
        console.error('Failed to load timeline:', err);
        if (!cancelled) setError('Could not load activity.');
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType, version]);

  const present = useMemo(() => (items ? kindsPresent(items) : []), [items]);
  const visible = useMemo(() => (items ? filterTimeline(items, kinds).slice(0, shown) : []), [items, kinds, shown]);
  const total = items ? filterTimeline(items, kinds).length : 0;
  const groups = useMemo(() => groupTimelineByMonth(visible), [visible]);

  const toggleKind = (k: TimelineKind) => {
    setShown(PAGE_SIZE);
    setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  };
  const toggleGroup = (key: string) =>
    setCollapsed((cur) => {
      const next = new Set(cur);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && items === null && <p className="text-sm text-gray-500">Loading...</p>}
      {items && items.length === 0 && <p className="text-sm text-gray-600">No activity recorded yet.</p>}

      {items && items.length > 0 && (
        <>
          {present.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter timeline">
              {present.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kinds.includes(k)}
                  onClick={() => toggleKind(k)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${kinds.includes(k) ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
          )}

          {groups.map((group) => (
            <section key={group.key} className="mb-3">
              <button
                type="button"
                aria-expanded={!collapsed.has(group.key)}
                onClick={() => toggleGroup(group.key)}
                className="mb-2 flex w-full items-center gap-1 text-sm font-medium text-gray-600"
              >
                {collapsed.has(group.key) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {group.label} <span className="text-gray-400">({group.items.length})</span>
              </button>
              {!collapsed.has(group.key) && (
                <ol className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-full bg-blue-100 p-2 text-blue-700">{ICONS[item.kind]}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {item.pinned && <Pin className="mr-1 inline h-3 w-3 text-amber-500" aria-label="Pinned" />}
                          {item.title}
                        </p>
                        {item.description &&
                          (item.kind === 'note' ? <MarkdownLite text={item.description} /> : <p className="text-sm text-gray-600 whitespace-pre-line">{item.description}</p>)}
                        <p className="text-xs text-gray-500">
                          {item.who ? `${item.who} · ` : ''}
                          {item.at.toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          {shown < total && (
            <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className="text-sm font-medium text-blue-600 hover:underline">
              Load more ({total - shown} more)
            </button>
          )}
          {total === 0 && <p className="text-sm text-gray-600">Nothing matches the filter.</p>}
        </>
      )}
    </div>
  );
};
