/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/utils/computeNewEvenlySpacedPositions.ts
 * Changes: import paths only.
 */
import { doNotTranslate } from '../shared/doNotTranslate';

export const computeNewEvenlySpacedPositions = ({
  startingPosition,
  endingPosition,
  numberOfRecordsToInsertBetween,
}: {
  startingPosition: number;
  endingPosition: number;
  numberOfRecordsToInsertBetween: number;
}) => {
  const positionGapSize = endingPosition - startingPosition;

  if (positionGapSize === 0) {
    return Array.from(
      { length: numberOfRecordsToInsertBetween },
      () => endingPosition,
    );
  }

  if (positionGapSize < 0) {
    throw new Error(
      doNotTranslate(
        `Cannot compute positions because starting position (${startingPosition}) is after ending position (${endingPosition})`,
      ),
    );
  }

  const positionStep = positionGapSize / (numberOfRecordsToInsertBetween + 1);

  const newPositionsBetween: number[] = [];

  for (let i = 1; i <= numberOfRecordsToInsertBetween; i++) {
    newPositionsBetween.push(startingPosition + positionStep * i);
  }

  return newPositionsBetween;
};
