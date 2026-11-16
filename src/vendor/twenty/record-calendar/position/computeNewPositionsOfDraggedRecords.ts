/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/utils/computeNewPositionsOfDraggedRecords.ts
 * Changes: import paths only.
 */
import { computeNewEvenlySpacedPositions } from './computeNewEvenlySpacedPositions';
import { type RecordWithPosition } from './computeNewPositionOfDraggedRecord';
import { isDefined } from './isDefined';
import { doNotTranslate } from '../shared/doNotTranslate';

export const computeNewPositionsOfDraggedRecords = ({
  arrayOfRecordsWithPosition,
  draggedRecordId,
  targetRecordId,
  sourceRecordIds,
  isDroppedAfterList,
}: {
  arrayOfRecordsWithPosition: RecordWithPosition[];
  draggedRecordId: string;
  targetRecordId: string;
  sourceRecordIds: string[];
  isDroppedAfterList: boolean;
}): RecordWithPosition[] => {
  const indexOfTargetItem = arrayOfRecordsWithPosition.findIndex(
    (recordToFind) => recordToFind.id === targetRecordId,
  );

  const targetItem = arrayOfRecordsWithPosition[indexOfTargetItem];

  if (!isDefined(targetItem)) {
    throw new Error(
      doNotTranslate(`Cannot find item to move for id : ${targetRecordId}`),
    );
  }

  const indexOfItemToMove = arrayOfRecordsWithPosition.findIndex(
    (recordToFind) => recordToFind.id === draggedRecordId,
  );

  const positionAfterTarget = targetItem.position + sourceRecordIds.length + 1;

  const getInsertionRange = (): [number, number] => {
    // Dropping the dragged record where it was still gathers the rest of the
    // selection around it
    if (targetRecordId === draggedRecordId) {
      const sourceRecordIdSet = new Set(sourceRecordIds);

      const previousUnselectedRecord = arrayOfRecordsWithPosition
        .slice(0, indexOfTargetItem)
        .findLast((record) => !sourceRecordIdSet.has(record.id));
      const nextUnselectedRecord = arrayOfRecordsWithPosition
        .slice(indexOfTargetItem + 1)
        .find((record) => !sourceRecordIdSet.has(record.id));

      return [
        previousUnselectedRecord?.position ?? targetItem.position - 1,
        nextUnselectedRecord?.position ?? positionAfterTarget,
      ];
    }

    const isMovingDown =
      indexOfItemToMove !== -1 && indexOfItemToMove < indexOfTargetItem;

    if (isDroppedAfterList || isMovingDown) {
      return [
        targetItem.position,
        arrayOfRecordsWithPosition[indexOfTargetItem + 1]?.position ??
          positionAfterTarget,
      ];
    }

    return [
      arrayOfRecordsWithPosition[indexOfTargetItem - 1]?.position ??
        targetItem.position - 1,
      targetItem.position,
    ];
  };

  const [startingPosition, endingPosition] = getInsertionRange();

  const newPositions = computeNewEvenlySpacedPositions({
    startingPosition,
    endingPosition,
    numberOfRecordsToInsertBetween: sourceRecordIds.length,
  });

  return sourceRecordIds.map((recordId, index) => ({
    id: recordId,
    position: newPositions[index],
  }));
};
