/** Fired (on window) after Calendar Settings saves, so a calendar that is already open picks the new values up. */
export const CALENDAR_PREFERENCES_CHANGED = 'calendar-preferences:changed';

/** Fired (on window) after the calendar blocklist changes, so an open calendar reloads its events. */
export const CALENDAR_BLOCKLIST_CHANGED = 'calendar-blocklist:changed';
