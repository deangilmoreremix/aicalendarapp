/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/utils/sort.ts
 * Changes: import paths only (and Lingui `t` -> plain strings where noted).
 */
import { isNonEmptyString } from '@sniptt/guards';

import { type Maybe } from '../types/generated';

export const sortNullsFirst = (
  fieldValueA: Maybe<unknown>,
  fieldValueB: Maybe<unknown>,
) =>
  fieldValueA === null && fieldValueB === null
    ? 0
    : fieldValueA === null
      ? -1
      : fieldValueB === null
        ? 1
        : 0;

export const sortNullsLast = (
  fieldValueA: Maybe<unknown>,
  fieldValueB: Maybe<unknown>,
) => sortNullsFirst(fieldValueB, fieldValueA);

export const sortAsc = (
  fieldValueA: string | number,
  fieldValueB: string | number,
) => {
  const valueA = isNonEmptyString(fieldValueA)
    ? fieldValueA.toLowerCase()
    : fieldValueA;
  const valueB = isNonEmptyString(fieldValueB)
    ? fieldValueB.toLowerCase()
    : fieldValueB;

  return valueA === valueB ? 0 : valueA < valueB ? -1 : 1;
};

export const sortDesc = (
  fieldValueA: string | number,
  fieldValueB: string | number,
) => sortAsc(fieldValueB, fieldValueA);
