/**
 * Ours (glue; Twenty: record-calendar-card anchored portal): a small preview next to a calendar card on hover or
 * keyboard focus. Fixed-positioned so the calendar cell never clips it; same panel style as the context menu.
 */
import { useRef, useState, type ReactNode } from 'react';
import { format } from 'date-fns';

import type { UnifiedCalendarRecord } from './unifiedCalendarRecords';

const TYPE_LABEL = { task: 'Task', deal: 'Deal', contact: 'Contact', event: 'Event' } as const;

export const RecordPreview = ({ record, children }: { record: UnifiedCalendarRecord; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      x: Math.max(8, Math.min(r.left, window.innerWidth - 268)),
      y: r.bottom + 220 > window.innerHeight ? Math.max(8, r.top - 150) : r.bottom + 4
    });
  };

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)} className="h-full">
      {children}
      {pos && (
        <div
          role="tooltip"
          style={{ position: 'fixed', left: pos.x, top: pos.y }}
          className="pointer-events-none z-50 w-64 rounded-md border border-gray-200 bg-white p-3 text-left text-xs text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100">{record.title}</p>
          <p className="text-gray-500">
            {TYPE_LABEL[record.type]}
            {record.status ? ` · ${record.status}` : ''}
          </p>
          <p className="mt-1">{record.allDay ? format(record.start, 'EEE, MMM d') : `${format(record.start, 'EEE, MMM d · p')} – ${format(record.end, 'p')}`}</p>
          {record.subtitle && <p className="mt-1">{record.subtitle}</p>}
          {record.ownerName && <p className="mt-1 text-gray-500">{record.ownerName}</p>}
        </div>
      )}
    </div>
  );
};
