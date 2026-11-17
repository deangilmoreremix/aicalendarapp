/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/object-record/utils/__tests__/computeNewEvenlySpacedPositions.test.ts
 * Changes: import paths only.
 */
import { describe, it, expect } from 'vitest';
import { computeNewEvenlySpacedPositions } from '../computeNewEvenlySpacedPositions';

describe('computeNewEvenlySpacedPositions', () => {
  it('should compute evenly spaced positions between two values', () => {
    const result = computeNewEvenlySpacedPositions({
      startingPosition: 0,
      endingPosition: 10,
      numberOfRecordsToInsertBetween: 4,
    });

    expect(result).toEqual([2, 4, 6, 8]);
  });

  it('should return a single midpoint when inserting one record', () => {
    const result = computeNewEvenlySpacedPositions({
      startingPosition: 0,
      endingPosition: 10,
      numberOfRecordsToInsertBetween: 1,
    });

    expect(result).toEqual([5]);
  });

  it('should return all same values when gap is zero', () => {
    const result = computeNewEvenlySpacedPositions({
      startingPosition: 5,
      endingPosition: 5,
      numberOfRecordsToInsertBetween: 3,
    });

    expect(result).toEqual([5, 5, 5]);
  });

  it('should throw when starting position is after ending position', () => {
    expect(() =>
      computeNewEvenlySpacedPositions({
        startingPosition: 10,
        endingPosition: 5,
        numberOfRecordsToInsertBetween: 1,
      }),
    ).toThrow();
  });
});
