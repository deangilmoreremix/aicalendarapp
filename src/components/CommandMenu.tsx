/**
 * Command menu (Ctrl/Cmd+K). Modelled on Twenty's command menu: one box to find a record or run an action.
 * Ours (glue): Twenty's engine is metadata/GraphQL driven; this one searches the loaded records and a small command list.
 * Uses the app's own dialog and colours.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarPlus, Handshake, ListChecks, Search, Star, User, CalendarDays, Zap } from 'lucide-react';

import { Dialog, DialogContent } from './ui/dialog';
import { TaskDetailsModal } from './TaskDetailsModal';
import { CalendarEventComposerModal } from './calendar/CalendarEventComposerModal';
import { useTaskStore } from '../store/taskStore';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { useOpenRecordStore } from '../store/openRecordStore';
import { useTheme } from '../contexts/ThemeContext';
import {
  readRecent,
  rememberRecent,
  searchCommands,
  searchRecords,
  type CommandDef,
  type Searchable,
  type SearchableType
} from '../lib/commandMenu/searchRecords';

export type AppView = 'calendar' | 'kanban' | 'list' | 'activity';

const ICON: Record<SearchableType, React.ComponentType<{ className?: string }>> = {
  task: ListChecks,
  deal: Handshake,
  contact: User,
  event: CalendarDays
};
const TYPE_LABEL: Record<SearchableType, string> = { task: 'Task', deal: 'Deal', contact: 'Contact', event: 'Event' };

type Row = { key: string; kind: 'record'; record: Searchable } | { key: string; kind: 'command'; command: CommandDef };

export const CommandMenu = ({
  onNavigate,
  onNewContact,
  onNewDeal,
  onOpenSettings,
  onDeleteMockData
}: {
  onNavigate: (view: AppView) => void;
  onNewContact: () => void;
  onNewDeal: () => void;
  onOpenSettings: () => void;
  onDeleteMockData: () => void;
}) => {
  const { toggleTheme } = useTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const events = useTaskStore((s) => s.calendarEvents);
  const deals = useDealStore((s) => s.deals);
  const contacts = useContactStore((s) => s.contacts);
  const openRecord = useOpenRecordStore((s) => s.open);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState<null | 'task' | 'event'>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Ctrl/Cmd+K toggles; the header button dispatches the same event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('command-menu:open', onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('command-menu:open', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    // make sure everything searchable is loaded (these are cheap no-ops when already loaded)
    if (Object.keys(useDealStore.getState().deals).length === 0) void useDealStore.getState().loadDeals();
    if (Object.keys(useContactStore.getState().contacts).length === 0) void useContactStore.getState().loadContacts();
    if (Object.keys(useTaskStore.getState().tasks).length === 0) void useTaskStore.getState().loadInitialData();
  }, [open]);

  const searchables: Searchable[] = useMemo(
    () => [
      ...Object.values(tasks).map((t) => ({ type: 'task' as const, id: t.id, title: t.title, subtitle: [t.status, t.priority, t.assignedUserName].filter(Boolean).join(' · '), favorite: t.isFavorite })),
      ...Object.values(deals).map((d) => ({ type: 'deal' as const, id: d.id, title: d.company, subtitle: [d.value, d.stage].filter(Boolean).join(' · '), favorite: d.isFavorite })),
      ...Object.values(contacts).map((c) => ({ type: 'contact' as const, id: c.id, title: c.name, subtitle: [c.company, c.title, c.email].filter(Boolean).join(' · '), favorite: c.isFavorite })),
      ...events.map((e) => ({ type: 'event' as const, id: e.id, title: e.title, subtitle: e.location }))
    ],
    [tasks, deals, contacts, events]
  );

  const close = () => setOpen(false);
  const go = (fn: () => void) => () => {
    close();
    fn();
  };
  const commands: CommandDef[] = useMemo(
    () => [
      { id: 'new-task', label: 'New task', keywords: 'create add todo', run: go(() => setCreating('task')) },
      { id: 'new-event', label: 'New event', keywords: 'create add meeting calendar', run: go(() => setCreating('event')) },
      { id: 'new-contact', label: 'New contact', keywords: 'create add person', run: go(onNewContact) },
      { id: 'new-deal', label: 'New deal', keywords: 'create add opportunity', run: go(onNewDeal) },
      { id: 'go-calendar', label: 'Go to Calendar', keywords: 'view month week', run: go(() => onNavigate('calendar')) },
      { id: 'go-kanban', label: 'Go to Kanban board', keywords: 'view columns', run: go(() => onNavigate('kanban')) },
      { id: 'go-list', label: 'Go to Task list', keywords: 'view all tasks', run: go(() => onNavigate('list')) },
      { id: 'go-activity', label: 'Go to Activity feed', keywords: 'view history', run: go(() => onNavigate('activity')) },
      { id: 'theme', label: 'Toggle dark mode', keywords: 'theme light dark', run: go(toggleTheme) },
      { id: 'settings', label: 'Open calendar settings', keywords: 'preferences visibility', run: go(onOpenSettings) },
      { id: 'mock', label: 'Delete mock data', keywords: 'sample demo clear', run: go(onDeleteMockData) }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onNavigate, onNewContact, onNewDeal, onOpenSettings, onDeleteMockData, toggleTheme]
  );

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    if (!query.trim()) {
      const byKey = new Map(searchables.map((s) => [`${s.type}:${s.id}`, s]));
      for (const r of readRecent()) {
        const s = byKey.get(`${r.type}:${r.id}`);
        if (s) out.push({ key: `recent:${s.type}:${s.id}`, kind: 'record', record: s });
      }
      for (const s of searchables.filter((x) => x.favorite).slice(0, 4)) {
        if (!out.some((o) => o.kind === 'record' && o.record.type === s.type && o.record.id === s.id)) out.push({ key: `fav:${s.type}:${s.id}`, kind: 'record', record: s });
      }
    } else {
      for (const s of searchRecords(query, searchables)) out.push({ key: `r:${s.type}:${s.id}`, kind: 'record', record: s });
    }
    for (const c of searchCommands(query, commands, query.trim() ? 6 : 11)) out.push({ key: `c:${c.id}`, kind: 'command', command: c });
    return out;
  }, [query, searchables, commands]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const choose = (row: Row | undefined) => {
    if (!row) return;
    if (row.kind === 'command') return row.command.run();
    rememberRecent({ type: row.record.type, id: row.record.id });
    close();
    openRecord(row.record.type, row.record.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(rows[active]);
    }
  };

  return (
    <>
      {open && (
        <Dialog open onOpenChange={(o) => !o && close()}>
          <DialogContent className="max-w-xl">
            <div className="text-left" onKeyDown={onKeyDown}>
              <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  autoFocus
                  role="combobox"
                  aria-expanded
                  aria-controls="command-menu-list"
                  aria-activedescendant={rows[active] ? `cmd-${rows[active].key}` : undefined}
                  aria-label="Search records and commands"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks, deals, contacts, events, or type a command…"
                  className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
                />
              </div>
              <ul id="command-menu-list" ref={listRef} role="listbox" className="max-h-80 overflow-y-auto py-1">
                {rows.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500">No results for “{query}”.</li>}
                {rows.map((row, i) => {
                  const selected = i === active;
                  const showHeader = i === 0 || rows[i - 1].kind !== row.kind;
                  const Icon = row.kind === 'record' ? ICON[row.record.type] : Zap;
                  return (
                    <li key={row.key} role="presentation">
                      {showHeader && (
                        <p className="px-4 pb-1 pt-2 text-xs font-medium uppercase text-gray-400">
                          {row.kind === 'command' ? 'Commands' : query.trim() ? 'Records' : 'Recent and favorites'}
                        </p>
                      )}
                      <div
                        id={`cmd-${row.key}`}
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(row)}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-sm ${selected ? 'bg-blue-50 text-blue-900 dark:bg-gray-700 dark:text-white' : 'text-gray-800 dark:text-gray-100'}`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                        {row.kind === 'record' ? (
                          <>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">
                                {row.record.favorite && <Star className="mr-1 inline h-3 w-3 fill-current text-amber-500" aria-label="Favorite" />}
                                {row.record.title}
                              </span>
                              {row.record.subtitle && <span className="block truncate text-xs text-gray-500">{row.record.subtitle}</span>}
                            </span>
                            <span className="text-xs text-gray-400">{TYPE_LABEL[row.record.type]}</span>
                          </>
                        ) : (
                          <span className="flex-1">{row.command.label}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="border-t border-gray-200 px-4 py-2 text-xs text-gray-400 dark:border-gray-700">↑↓ to move · Enter to open · Esc to close</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {creating === 'task' && <TaskDetailsModal task={null} isOpen onClose={() => setCreating(null)} />}
      {creating === 'event' && (
        <CalendarEventComposerModal
          isOpen
          context={{ targets: [] }}
          onClose={() => setCreating(null)}
          onCreated={() => undefined}
        />
      )}
    </>
  );
};

export const CommandMenuButton = ({ isDark }: { isDark: boolean }) => (
  <button
    type="button"
    onClick={() => window.dispatchEvent(new Event('command-menu:open'))}
    aria-label="Open command menu"
    title="Search and commands (Ctrl+K)"
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
      isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200'
    }`}
  >
    <Search size={18} />
    <span className="hidden md:inline text-xs opacity-70">Ctrl K</span>
  </button>
);
