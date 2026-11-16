/**
 * Within-day ordering of calendar records.
 *
 * The position arithmetic is Twenty's own, vendored unchanged in `src/vendor/twenty/record-calendar/position`
 * (computeNewPositionOfDraggedRecord). What is ours (glue) is feeding it from this app's records, and the drop-index
 * rules, which follow upstream's useProcessCalendarCardDrop (isDroppedAfterList, empty day -> position 1).
 * Twenty's records always carry a position; ours start without one, so a day whose positions are not distinct is
 * numbered 1..n in its current order first (those numbers are saved together with the move).
 */
import { computeNewPositionOfDraggedRecord } from '../../vendor/twenty/record-calendar/position/computeNewPositionOfDraggedRecord';
import type { UnifiedCalendarRecord } from './unifiedCalendarRecords';

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Order used everywhere a day's records are listed: saved position first, then time, then title. */
export const compareWithinDay = (a: UnifiedCalendarRecord, b: UnifiedCalendarRecord) =>
  (a.position ?? 0) - (b.position ?? 0) || +a.start - +b.start || a.title.localeCompare(b.title);

export const getDayRecords = (records: UnifiedCalendarRecord[], day: Date): UnifiedCalendarRecord[] =>
  records.filter((r) => sameDay(r.start, day)).sort(compareWithinDay);

export type PositionUpdate = { record: UnifiedCalendarRecord; position: number };

/**
 * Where a record lands when dropped at `destinationIndex` of its day's list (the list as displayed, before the move).
 * Returns the position updates to persist: the moved record, plus the rest of the day when it first needed numbering.
 */
export const computeDayDropUpdates = ({
  dayRecords,
  draggedKey,
  destinationIndex
}: {
  dayRecords: UnifiedCalendarRecord[];
  draggedKey: string;
  destinationIndex: number;
}): PositionUpdate[] => {
  const dragged = dayRecords.find((r) => r.key === draggedKey);
  if (!dragged || dayRecords.length < 2) return [];

  const positions = dayRecords.map((r) => r.position ?? 0);
  const needsNumbering = new Set(positions).size !== positions.length;
  const withPosition = dayRecords.map((record, index) => ({
    id: record.key,
    position: needsNumbering ? index + 1 : record.position ?? 0
  }));

  // Same list in and out, so the index needs no adjustment (upstream adjusts only for cross-day drops).
  const isDroppedAfterList =
    (withPosition.length === 2 && destinationIndex === 1) || destinationIndex === withPosition.length;
  const target = isDroppedAfterList ? withPosition.at(-1) : withPosition.at(destinationIndex);
  if (!target) return [];

  const newPosition = computeNewPositionOfDraggedRecord({
    arrayOfRecordsWithPosition: withPosition,
    idOfItemToMove: draggedKey,
    idOfTargetItem: target.id,
    isDroppedAfterList
  });

  const updates: PositionUpdate[] = [];
  for (const [index, record] of dayRecords.entries()) {
    if (record.key === draggedKey) {
      if (newPosition !== (record.position ?? 0) || needsNumbering) updates.push({ record, position: newPosition });
    } else if (needsNumbering && withPosition[index].position !== (record.position ?? 0)) {
      updates.push({ record, position: withPosition[index].position });
    }
  }
  return updates;
};
