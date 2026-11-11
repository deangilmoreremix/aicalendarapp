/**
 * Calendar card with record-specific information.
 * Pattern from twentyhq/twenty record-calendar-card (RecordCalendarCard / Header / Body): a card shows the record's
 * visible fields. Rendered inside react-big-calendar's event slot, in this app's styling.
 */
import { CalendarCheck, CalendarDays, Handshake, ListChecks, User } from 'lucide-react';

import type { UnifiedCalendarRecord, UnifiedRecordType } from './unifiedCalendarRecords';

const ICONS: Record<UnifiedRecordType, React.ComponentType<{ className?: string }>> = {
  task: ListChecks,
  deal: Handshake,
  contact: User,
  event: CalendarDays
};

type RecordCalendarEventCardProps = {
  record: UnifiedCalendarRecord;
  isSelected: boolean;
  /** month view cells are small, so only the title shows there */
  compact: boolean;
  onContextMenu: (event: React.MouseEvent, record: UnifiedCalendarRecord) => void;
};

export const RecordCalendarEventCard = ({ record, isSelected, compact, onContextMenu }: RecordCalendarEventCardProps) => {
  const Icon = ICONS[record.type];
  const done = record.status === 'completed' || record.status === 'closed-won' || record.status === 'cancelled';

  return (
    <div
      data-selected={isSelected}
      data-record-type={record.type}
      className={`flex h-full min-w-0 flex-col justify-center rounded px-1 ${isSelected ? 'ring-2 ring-white/90' : ''}`}
      onContextMenu={(e) => onContextMenu(e, record)}
    >
      <div className={`flex items-center gap-1 truncate text-xs font-medium ${done ? 'line-through opacity-80' : ''}`}>
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{record.title}</span>
        {record.type === 'task' && record.status === 'completed' && <CalendarCheck className="h-3 w-3 shrink-0" />}
      </div>
      {!compact && record.subtitle && <div className="truncate text-[10px] opacity-90">{record.subtitle}</div>}
    </div>
  );
};
