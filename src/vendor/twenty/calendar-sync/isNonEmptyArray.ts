/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-shared/src/utils/array/isNonEmptyArray.ts
 * Changes: import paths. Logic unchanged.
 */
import { isNumber } from '@sniptt/guards';

export const isNonEmptyArray = <TArray extends readonly unknown[]>(
  probableArray: TArray | undefined | null,
): probableArray is TArray & { 0: TArray[number] } => {
  if (
    Array.isArray(probableArray) &&
    isNumber(probableArray.length) &&
    probableArray.length > 0 &&
    0 in probableArray
  ) {
    return true;
  }

  return false;
};
