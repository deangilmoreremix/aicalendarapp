/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-shared/src/utils/date/__tests__/getValidTimeZoneOrUndefined.test.ts
 * Changes: import paths; tests: jest globals -> vitest imports. Logic unchanged.
 */
import { describe, it, expect } from 'vitest';
import { getValidTimeZoneOrUndefined } from '../getValidTimeZoneOrUndefined';

describe('getValidTimeZoneOrUndefined', () => {
  it('should return undefined for null, undefined, empty string, and system', () => {
    expect(getValidTimeZoneOrUndefined(null)).toBeUndefined();
    expect(getValidTimeZoneOrUndefined(undefined)).toBeUndefined();
    expect(getValidTimeZoneOrUndefined('')).toBeUndefined();
    expect(getValidTimeZoneOrUndefined('system')).toBeUndefined();
  });

  it('should return undefined for invalid IANA time zones', () => {
    expect(getValidTimeZoneOrUndefined('Not/A_Timezone')).toBeUndefined();
  });

  it('should return the time zone for valid IANA time zones', () => {
    expect(getValidTimeZoneOrUndefined('America/New_York')).toBe(
      'America/New_York',
    );
    expect(getValidTimeZoneOrUndefined('UTC')).toBe('UTC');
  });
});
