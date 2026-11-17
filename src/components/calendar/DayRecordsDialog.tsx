/**
 * Ours (glue): one day's records as an ordered list that can be reordered by dragging (mouse, touch or keyboard:
 * space to lift, arrows to move). Twenty orders cards within a calendar day by their `position`; the position maths
 * is Twenty's (see dayOrder.ts). react-big-calendar only reports which day a card was dropped on, so within-day order
 * is edited here, with the already-installed @hello-pangea/dnd (the same library as the Kanban board).
 */
import { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { GripVertical, X } from 'lucide-react';

import { Dialog, DialogContent } from '../ui/dialog';
import type { UnifiedCalendarRecord } from './unifiedCalendarRecords';
import { computeDayDropUpdates, compareWithinDay } from './dayOrder';
import { applyPositionUpdates } from './recordCalendarActions';

const TYPE_LABEL: Record<UnifiedCalendarRecord['type'], string> = { task: 'Task', deal: 'Deal', contact: 'Contact', event: 'Event' };
const TYPE_COLOR: Record<UnifiedCalendarRecord['type'], string> = {
  task: 'bg-blue-100 text-blue-800',
  deal: 'bg-purple-100 text-purple-800',
  contact: 'bg-teal-100 text-teal-800',
  event: 'bg-sky-100 text-sky-800'
};

export const DayRecordsDialog = ({
  day,
  records,
  onClose,
  onOpenRecord
}: {
  day: Date;
  /** records that fall on `day` (already filtered by the caller) */
  records: UnifiedCalendarRecord[];
  onClose: () => void;
  onOpenRecord?: (record: UnifiedCalendarRecord) => void;
}) => {
  const ordered = useMemo(() => [...records].sort(compareWithinDay), [records]);
  // local copy so the list reorders immediately; it is replaced by the stores' data once they update
  const [order, setOrder] = useState<UnifiedCalendarRecord[]>(ordered);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setOrder(ordered), [ordered]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.index === source.index) return;
    setError(null);

    const updates = computeDayDropUpdates({ dayRecords: order, draggedKey: draggableId, destinationIndex: destination.index });
    const previous = order;
    const next = [...order];
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    setOrder(next);

    if (updates.length === 0) return;
    if (!(await applyPositionUpdates(updates))) {
      setOrder(previous);
      setError('Could not save the new order.');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <div className="space-y-3 p-6 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{format(day, 'EEEE, MMMM d')}</h2>
              <p className="text-xs text-gray-500">Drag to reorder this day. Order is saved.</p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {order.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Nothing on this day.</p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId={format(day, 'yyyy-MM-dd')}>
                {(provided) => (
                  <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2" aria-label="Records on this day">
                    {order.map((record, index) => (
                      <Draggable key={record.key} draggableId={record.key} index={index}>
                        {(drag, snapshot) => (
                          <li
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 text-sm ${
                              snapshot.isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200'
                            }`}
                          >
                            <span {...drag.dragHandleProps} aria-label={`Reorder ${record.title}`} className="cursor-grab text-gray-400">
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[record.type]}`}>{TYPE_LABEL[record.type]}</span>
                            <button
                              type="button"
                              className="min-w-0 flex-1 truncate text-left text-gray-900 hover:underline"
                              onClick={() => onOpenRecord?.(record)}
                            >
                              {record.title}
                            </button>
                            {!record.allDay && <span className="text-xs text-gray-500">{format(record.start, 'p')}</span>}
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};
