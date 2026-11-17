/**
 * Ported from twentyhq/twenty @ f5cfa249c9fa (AGPL-3.0, used with the owner's permission).
 * Upstream: packages/twenty-server/src/modules/calendar/calendar-event-creation-manager/utils/__tests__/resolve-calendar-event-time-zone.util.spec.ts
 * Changes: import paths; tests: jest globals -> vitest imports. Logic unchanged.
 */
import { describe, it, expect } from 'vitest';
import { resolveCalendarEventTimeZone } from '../resolve-calendar-event-time-zone.util';

describe('resolveCalendarEventTimeZone', () => {
  it('defaults to UTC when no time zone is provided', () => {
    expect(resolveCalendarEventTimeZone(undefined)).toBe('UTC');
  });

  it('defaults to UTC when the time zone is an empty string', () => {
    expect(resolveCalendarEventTimeZone('')).toBe('UTC');
  });

  it('keeps a provided time zone', () => {
    expect(resolveCalendarEventTimeZone('Europe/Paris')).toBe('Europe/Paris');
  });
});
