/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-shared/src/utils/validation/isDefined.ts
 * Changes: import paths only.
 */
import { isNull, isUndefined } from '@sniptt/guards';

export const isDefined = <T>(
  value: T | null | undefined,
): value is NonNullable<T> => !isUndefined(value) && !isNull(value);
