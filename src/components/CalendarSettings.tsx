import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Settings, CheckCircle } from 'lucide-react';
import { calendarEventApi, calendarBlocklistApi } from '../services/api';
import { CalendarChannelVisibility } from '../vendor/twenty/calendar/shared/CalendarChannelVisibility';

// Calendar preferences are stored locally. No third-party calendar providers are used:
// the app's stack is Netlify + Supabase + OpenAI only.
interface CalendarPreferences {
  timezone: string;
  workdayStart: string;
  workdayEnd: string;
  defaultMeetingMinutes: number;
  weekStartsOn: 0 | 1;
}

import { CALENDAR_PREFERENCES_CHANGED, CALENDAR_BLOCKLIST_CHANGED } from '../lib/calendarPreferences';

const STORAGE_KEY = 'calendar-preferences';

const defaults: CalendarPreferences = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  workdayStart: '09:00',
  workdayEnd: '17:00',
  defaultMeetingMinutes: 30,
  weekStartsOn: 1,
};

const load = (): CalendarPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
};

export const CalendarSettings: React.FC = () => {
  const [prefs, setPrefs] = useState<CalendarPreferences>(load);
  const [saved, setSaved] = useState(false);
  const [visibility, setVisibility] = useState<CalendarChannelVisibility>(CalendarChannelVisibility.SHARE_EVERYTHING);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{ id: string; handle: string }[]>([]);
  const [blockLoaded, setBlockLoaded] = useState(false);
  const [blockLoadFailed, setBlockLoadFailed] = useState(false);
  const [blockInput, setBlockInput] = useState('');
  const [blockError, setBlockError] = useState<string | null>(null);
  // only the newest list read may update the screen (an older, slower one must not bring back a removed entry)
  const blockRequest = useRef(0);

  const loadBlocked = async () => {
    const request = ++blockRequest.current;
    try {
      const list = await calendarBlocklistApi.getAll();
      if (request !== blockRequest.current) return;
      setBlocked(list);
      setBlockLoaded(true);
      setBlockLoadFailed(false);
    } catch (err) {
      console.error('Could not load the calendar blocklist:', err);
      if (request === blockRequest.current) setBlockLoadFailed(true);
    }
  };

  useEffect(() => {
    void loadBlocked();
  }, []);

  const addBlocked = async () => {
    const handle = blockInput.trim().toLowerCase();
    if (!handle) return;
    setBlockError(null);
    try {
      await calendarBlocklistApi.add(handle);
    } catch (err) {
      console.error('Could not add to the blocklist:', err);
      setBlockError('Could not add it to the blocklist.');
      return;
    }
    // the write succeeded: tell open calendars and clear the box; refreshing the list is a separate step that may fail
    window.dispatchEvent(new Event(CALENDAR_BLOCKLIST_CHANGED));
    setBlockInput('');
    await loadBlocked();
  };

  const removeBlocked = async (id: string) => {
    setBlockError(null);
    try {
      await calendarBlocklistApi.remove(id);
    } catch (err) {
      console.error('Could not remove from the blocklist:', err);
      setBlockError('Could not remove it from the blocklist.');
      return;
    }
    blockRequest.current += 1; // reads that started before this removal are out of date now
    setBlocked((list) => list.filter((entry) => entry.id !== id));
    window.dispatchEvent(new Event(CALENDAR_BLOCKLIST_CHANGED));
    // an entry added while reads were in flight may not be on screen yet: load the list again (older reads stay ignored)
    await loadBlocked();
  };

  useEffect(() => {
    calendarEventApi
      .getSettings()
      .then(({ defaultVisibility }) => setVisibility(defaultVisibility))
      .catch(err => console.error('Could not load calendar visibility:', err));
  }, []);

  const handleVisibilityChange = async (next: CalendarChannelVisibility) => {
    const previous = visibility;
    setVisibility(next);
    setVisibilityError(null);
    try {
      await calendarEventApi.setDefaultVisibility(next);
    } catch (err) {
      console.error('Could not save calendar visibility:', err);
      setVisibility(previous);
      setVisibilityError('Could not save event visibility.');
    }
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const update = <K extends keyof CalendarPreferences>(key: K, value: CalendarPreferences[K]) =>
    setPrefs(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Could not save calendar preferences:', error);
    }
    window.dispatchEvent(new Event(CALENDAR_PREFERENCES_CHANGED));
    setSaved(true);
  };

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Time zone</span>
            <input className={inputClass} value={prefs.timezone} onChange={e => update('timezone', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Week starts on</span>
            <select aria-label="Week starts on"
              className={inputClass}
              value={prefs.weekStartsOn}
              onChange={e => update('weekStartsOn', Number(e.target.value) as 0 | 1)}
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Workday starts</span>
            <input type="time" className={inputClass} value={prefs.workdayStart} onChange={e => update('workdayStart', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Workday ends</span>
            <input type="time" className={inputClass} value={prefs.workdayEnd} onChange={e => update('workdayEnd', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Default meeting length (minutes)</span>
            <input
              type="number"
              min={5}
              step={5}
              className={inputClass}
              value={prefs.defaultMeetingMinutes}
              onChange={e => update('defaultMeetingMinutes', Math.max(5, Number(e.target.value) || 30))}
            />
          </label>
          <div className="flex items-end gap-3">
            <Button onClick={handleSave}>Save</Button>
            {saved && (
              <span className="flex items-center text-sm text-green-700">
                <CheckCircle className="mr-1 h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-gray-600 dark:text-gray-400">Default for new events.</p>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="default-event-visibility"
              checked={visibility === CalendarChannelVisibility.SHARE_EVERYTHING}
              onChange={() => handleVisibilityChange(CalendarChannelVisibility.SHARE_EVERYTHING)}
            />
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">Everything</span>
              <span className="block text-xs text-gray-500">The whole event details will be shared with your team.</span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="default-event-visibility"
              checked={visibility === CalendarChannelVisibility.METADATA}
              onChange={() => handleVisibilityChange(CalendarChannelVisibility.METADATA)}
            />
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">Metadata</span>
              <span className="block text-xs text-gray-500">Only date &amp; participants will be shared with your team.</span>
            </span>
          </label>
          {visibilityError && <p className="text-xs text-red-600">{visibilityError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Events with a guest on this list are left out of the calendar. Add an address (ada@example.com) or a whole domain (@example.com).
          </p>
          <div className="flex gap-2">
            <input
              aria-label="Address or domain to block"
              placeholder="ada@example.com or @example.com"
              className={inputClass}
              value={blockInput}
              onChange={(e) => setBlockInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void addBlocked()}
            />
            <Button onClick={() => void addBlocked()}>Block</Button>
          </div>
          {blockLoadFailed && !blockLoaded ? (
            <p className="text-xs text-red-600">
              Could not load the blocklist.{' '}
              <button type="button" className="underline" onClick={() => void loadBlocked()}>
                Try again
              </button>
            </p>
          ) : !blockLoaded ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : blocked.length === 0 ? (
            <p className="text-xs text-gray-500">Nothing is blocked.</p>
          ) : (
            <ul className="space-y-1">
              {blocked.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-1.5 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-gray-100">{entry.handle}</span>
                  <button
                    type="button"
                    aria-label={`Unblock ${entry.handle}`}
                    onClick={() => void removeBlocked(entry.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {blockError && <p className="text-xs text-red-600">{blockError}</p>}
        </CardContent>
      </Card>
    </div>
  );
};
