/**
 * Contextual record menu. Opening pattern follows twentyhq/twenty useOpenRecordContextMenu (right-click selects the
 * record and opens a menu at the cursor). Upstream has no calendar-specific actions, so the actions (edit, duplicate,
 * reschedule, delete) are ours.
 */
import { useEffect, useRef } from 'react';
import { CalendarClock, CalendarPlus, Copy, Pencil, Trash2 } from 'lucide-react';

import type { UnifiedCalendarRecord } from './unifiedCalendarRecords';

export type RecordMenuAction = 'edit' | 'duplicate' | 'tomorrow' | 'nextWeek' | 'delete';

type RecordContextMenuProps = {
  record: UnifiedCalendarRecord;
  position: { x: number; y: number };
  onAction: (action: RecordMenuAction, record: UnifiedCalendarRecord) => void;
  onClose: () => void;
};

export const RecordContextMenu = ({ record, position, onAction, onClose }: RecordContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  // keep the menu inside the viewport (w-52 = 208px wide, about 5 rows tall)
  const MENU_WIDTH = 208;
  const MENU_HEIGHT = 200;
  const left = Math.max(8, Math.min(position.x, window.innerWidth - MENU_WIDTH - 8));
  const top = Math.max(8, Math.min(position.y, window.innerHeight - MENU_HEIGHT - 8));

  const canEdit = record.type !== 'event'; // events have no edit form yet
  const canDuplicate = record.type !== 'contact';
  const deleteLabel = record.type === 'contact' ? 'Clear follow-up' : 'Delete';

  const Item = ({ action, icon, label, danger }: { action: RecordMenuAction; icon: React.ReactNode; label: string; danger?: boolean }) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onAction(action, record);
        onClose();
      }}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
        danger ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={`${record.title} actions`}
      style={{ position: 'fixed', top, left }}
      className="z-50 w-52 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      {canEdit && <Item action="edit" icon={<Pencil className="h-4 w-4" />} label="Edit" />}
      {canDuplicate && <Item action="duplicate" icon={<Copy className="h-4 w-4" />} label="Duplicate" />}
      <Item action="tomorrow" icon={<CalendarClock className="h-4 w-4" />} label="Reschedule to tomorrow" />
      <Item action="nextWeek" icon={<CalendarPlus className="h-4 w-4" />} label="Reschedule +1 week" />
      <Item action="delete" icon={<Trash2 className="h-4 w-4" />} label={deleteLabel} danger />
    </div>
  );
};
