/**
 * Saved calendar views. The saved fields mirror twentyhq/twenty's View for calendars
 * (calendarLayout, the date field per record, filters, visible records); storage is the Supabase `calendar_views` table.
 */
import { useCallback, useEffect, useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { MenuPanel } from './MenuPanel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { calendarViewApi, type CalendarView } from '../../services/api';

type CalendarViewsMenuProps = {
  /** the current calendar state, saved when the user clicks "Save current view" */
  current: Omit<CalendarView, 'id' | 'position' | 'isDefault' | 'name'>;
  onApply: (view: CalendarView) => void;
};

export const CalendarViewsMenu = ({ current, onApply }: CalendarViewsMenuProps) => {
  const [views, setViews] = useState<CalendarView[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setViews(await calendarViewApi.getAll());
    } catch (err) {
      console.error('Failed to load calendar views:', err);
      setError('Could not load saved views.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      const created = await calendarViewApi.create({ ...current, name: name.trim() });
      setViews((v) => [...v, created]);
      setName('');
    } catch (err) {
      console.error('Failed to save calendar view:', err);
      setError('Could not save the view.');
    }
  };

  const remove = async (id: string) => {
    try {
      await calendarViewApi.delete(id);
      setViews((v) => v.filter((view) => view.id !== id));
    } catch (err) {
      console.error('Failed to delete calendar view:', err);
      setError('Could not delete the view.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Saved views">
          <Bookmark className="mr-2 h-4 w-4" />
          Views
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <MenuPanel className="space-y-2 p-3 text-sm">
          {views.length === 0 && <p className="text-gray-500">No saved views yet.</p>}
          {views.map((view) => (
            <div key={view.id} className="flex items-center justify-between gap-2">
              <button type="button" className="truncate text-left text-gray-900 hover:underline dark:text-gray-100" onClick={() => onApply(view)}>
                {view.name}
              </button>
              <button type="button" aria-label={`Delete view ${view.name}`} className="text-gray-400 hover:text-red-600" onClick={() => remove(view.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 border-t border-gray-200 pt-2 dark:border-gray-700">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void save()}
              placeholder="View name"
              aria-label="View name"
              className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
            />
            <Button size="sm" onClick={() => void save()} disabled={!name.trim()}>
              Save
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </MenuPanel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
