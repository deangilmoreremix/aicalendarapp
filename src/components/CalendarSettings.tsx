import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Settings, CheckCircle } from 'lucide-react';
import { calendarEventApi } from '../services/api';
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
            <select
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
    </div>
  );
};
