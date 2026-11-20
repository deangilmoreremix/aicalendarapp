/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-shared/src/utils/validation/isDefined.ts
 * Changes: import paths. Logic unchanged.
 */
import { isNull, isUndefined } from '@sniptt/guards';

export const isDefined = <T>(
  value: T | null | undefined,
): value is NonNullable<T> => !isUndefined(value) && !isNull(value);
