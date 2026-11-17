/**
 * Table view for contacts, deals and tasks (Twenty: record index table with views). Sortable columns, column picker,
 * search, rule filters, row selection with bulk actions, paging and saved views. Same card look as the task list.
 */
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Bookmark, Columns3, Filter, Search, Star, Trash2 } from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { useOpenRecordStore } from '../../store/openRecordStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MenuPanel } from '../calendar/MenuPanel';
import { FilterBuilder } from '../filters/FilterBuilder';
import { FIELDS_BY_OBJECT, FIELD_MAPS, type TableObject } from '../../lib/recordFilters/fields';
import { countActiveRules, filterRecords } from '../../lib/recordFilters/match';
import { emptyGroup, type FieldDef, type FilterGroup } from '../../lib/recordFilters/types';
import { DEFAULT_COLUMNS, cellText, nextSort, paginate, searchRows, sortRecords, type SortState } from '../../lib/table/tableModel';
import { recordViewApi, type RecordView } from '../../services/api';
import { applyBulk, type BulkAction } from './bulkActions';

const TABS: { key: TableObject; label: string }[] = [
  { key: 'contact', label: 'Contacts' },
  { key: 'deal', label: 'Deals' },
  { key: 'task', label: 'Tasks' }
];
const SET_FIELD = { contact: { field: 'status', label: 'Set status' }, deal: { field: 'stage', label: 'Set stage' }, task: { field: 'status', label: 'Set status' } } as const;

type Row = { id: string; [key: string]: unknown };

export const RecordTable = () => {
  const { isDark } = useTheme();
  const openRecord = useOpenRecordStore((s) => s.open);
  const tasks = useTaskStore((s) => s.tasks);
  const deals = useDealStore((s) => s.deals);
  const contacts = useContactStore((s) => s.contacts);

  const [object, setObject] = useState<TableObject>('contact');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterGroup>(emptyGroup());
  const [sort, setSort] = useState<SortState>({});
  const [columns, setColumns] = useState<string[]>([...DEFAULT_COLUMNS.contact]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [views, setViews] = useState<RecordView[]>([]);
  const [viewName, setViewName] = useState('');

  useEffect(() => {
    if (Object.keys(useContactStore.getState().contacts).length === 0) void useContactStore.getState().loadContacts();
    if (Object.keys(useDealStore.getState().deals).length === 0) void useDealStore.getState().loadDeals();
    if (Object.keys(useTaskStore.getState().tasks).length === 0) void useTaskStore.getState().loadInitialData();
  }, []);

  const defs = FIELDS_BY_OBJECT[object] as unknown as FieldDef<Row>[];
  const defMap = FIELD_MAPS[object] as unknown as Record<string, FieldDef<Row>>;
  const all = (object === 'contact' ? Object.values(contacts) : object === 'deal' ? Object.values(deals) : Object.values(tasks)) as unknown as Row[];

  useEffect(() => {
    recordViewApi.getAll(object).then(setViews).catch(() => setViews([]));
  }, [object]);

  const switchObject = (next: TableObject) => {
    setObject(next);
    setSearch('');
    setFilters(emptyGroup());
    setSort({});
    setColumns([...DEFAULT_COLUMNS[next]]);
    setSelected(new Set());
    setPage(1);
    setMessage(null);
  };

  const result = useMemo(() => {
    const filtered = filterRecords(searchRows(all, defs, search), filters, defMap);
    return paginate(sortRecords(filtered, defMap, sort), page, pageSize);
  }, [all, defs, defMap, search, filters, sort, page, pageSize]);

  const visibleDefs = defs.filter((d) => columns.includes(d.key));
  const pageIds = result.rows.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runBulk = async (action: BulkAction) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (action.type === 'delete' && !window.confirm(`Delete ${ids.length} ${object}${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
    const res = await applyBulk(object, ids, action);
    setMessage(res.failed ? `${res.done} updated, ${res.failed} failed.` : `${res.done} updated.`);
    setSelected(new Set());
  };

  const saveView = async () => {
    if (!viewName.trim()) return;
    try {
      const created = await recordViewApi.create({ name: viewName.trim(), objectType: object, filters, sort, columns });
      setViews((v) => [...v, created]);
      setViewName('');
    } catch {
      setMessage('Could not save the view.');
    }
  };
  const applyView = (v: RecordView) => {
    setFilters(v.filters);
    setSort(v.sort);
    setColumns(v.columns.length ? v.columns : [...DEFAULT_COLUMNS[object]]);
    setPage(1);
  };
  const removeView = async (id: string) => {
    try {
      await recordViewApi.delete(id);
      setViews((v) => v.filter((x) => x.id !== id));
    } catch {
      setMessage('Could not delete the view.');
    }
  };

  const setOptions = (defMap[SET_FIELD[object].field]?.options ?? []) as { value: string; label: string }[];
  const border = isDark ? 'border-white/10' : 'border-gray-100';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const input = `px-3 py-2 border rounded-xl text-sm ${isDark ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`;

  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
      <div className={`p-6 border-b ${border} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Record type" className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={object === t.key}
                onClick={() => switchObject(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  object === t.key ? 'bg-blue-600 text-white' : isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
              <input
                aria-label="Search table"
                placeholder="Search…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={`${input} pl-10`}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Filter table">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters{countActiveRules(filters) > 0 && <span className="ml-1 rounded-full bg-blue-600 px-1.5 text-xs text-white">{countActiveRules(filters)}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[28rem] max-w-[90vw]">
                <MenuPanel className="space-y-2 p-3 text-sm">
                  <FilterBuilder fields={defs} value={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
                  {countActiveRules(filters) > 0 && (
                    <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => setFilters(emptyGroup())}>
                      Clear all rules
                    </button>
                  )}
                </MenuPanel>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Choose columns">
                  <Columns3 className="mr-2 h-4 w-4" /> Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <MenuPanel className="max-h-72 overflow-y-auto p-3 text-sm">
                  {defs.map((d) => (
                    <label key={d.key} className="flex items-center gap-2 py-0.5">
                      <input
                        type="checkbox"
                        checked={columns.includes(d.key)}
                        onChange={() => setColumns((cur) => (cur.includes(d.key) ? (cur.length > 1 ? cur.filter((k) => k !== d.key) : cur) : [...cur, d.key]))}
                      />
                      {d.label}
                    </label>
                  ))}
                </MenuPanel>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Saved table views">
                  <Bookmark className="mr-2 h-4 w-4" /> Views
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <MenuPanel className="space-y-2 p-3 text-sm">
                  {views.length === 0 && <p className="text-gray-500">No saved views yet.</p>}
                  {views.map((v) => (
                    <div key={v.id} className="flex items-center justify-between gap-2">
                      <button type="button" className="truncate text-left hover:underline" onClick={() => applyView(v)}>
                        {v.name}
                      </button>
                      <button type="button" aria-label={`Delete view ${v.name}`} className="text-gray-400 hover:text-red-600" onClick={() => void removeView(v.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <input
                      aria-label="Table view name"
                      value={viewName}
                      onChange={(e) => setViewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void saveView()}
                      placeholder="View name"
                      className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                    />
                    <Button size="sm" disabled={!viewName.trim()} onClick={() => void saveView()}>
                      Save
                    </Button>
                  </div>
                </MenuPanel>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {selected.size > 0 && (
          <div role="toolbar" aria-label="Bulk actions" className={`flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-900'}`}>
            <span className="font-medium">{selected.size} selected</span>
            <button type="button" className="hover:underline" onClick={() => void runBulk({ type: 'favorite', value: true })}>Favorite</button>
            <button type="button" className="hover:underline" onClick={() => void runBulk({ type: 'favorite', value: false })}>Unfavorite</button>
            {object === 'task' && <button type="button" className="hover:underline" onClick={() => void runBulk({ type: 'complete' })}>Mark complete</button>}
            {object !== 'deal' && (
              <button
                type="button"
                className="hover:underline"
                onClick={() => {
                  const tag = window.prompt('Tag to add');
                  if (tag?.trim()) void runBulk({ type: 'addTag', tag: tag.trim() });
                }}
              >
                Add tag
              </button>
            )}
            <label className="flex items-center gap-1">
              <span className="sr-only">{SET_FIELD[object].label}</span>
              <select
                aria-label={SET_FIELD[object].label}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) void runBulk({ type: 'set', field: SET_FIELD[object].field, value: e.target.value });
                  e.target.value = '';
                }}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900"
              >
                <option value="" disabled>{SET_FIELD[object].label}…</option>
                {setOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <button type="button" className="text-red-600 hover:underline" onClick={() => void runBulk({ type: 'delete' })}>Delete</button>
            <button type="button" className="ml-auto hover:underline" onClick={() => setSelected(new Set())}>Clear selection</button>
          </div>
        )}
        {message && <p role="status" className={`text-sm ${muted}`}>{message}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${border} ${muted}`}>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allOnPage}
                  onChange={() => setSelected((cur) => (allOnPage ? new Set([...cur].filter((id) => !pageIds.includes(id))) : new Set([...cur, ...pageIds])))}
                />
              </th>
              {visibleDefs.map((d) => (
                <th key={d.key} aria-sort={sort.key === d.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-4 py-3 text-left font-medium">
                  <button type="button" onClick={() => { setSort(nextSort(sort, d.key)); setPage(1); }} className="inline-flex items-center gap-1 hover:underline">
                    {d.label}
                    {sort.key === d.key && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={visibleDefs.length + 1} className={`px-4 py-10 text-center ${muted}`}>
                  {all.length === 0 ? 'Nothing here yet.' : 'No records match the search and filters.'}
                </td>
              </tr>
            )}
            {result.rows.map((row) => (
              <tr key={row.id} className={`border-b ${border} cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`} onClick={() => openRecord(object, row.id)}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label={`Select ${cellText(defs[0], row)}`} checked={selected.has(row.id)} onChange={() => toggle(row.id)} />
                </td>
                {visibleDefs.map((d) => (
                  <td key={d.key} className={`px-4 py-3 ${text}`}>
                    {d.key === 'isFavorite' ? (
                      <Star aria-label={d.get(row) ? 'Favorite' : 'Not a favorite'} className={`h-4 w-4 ${d.get(row) ? 'fill-current text-amber-500' : 'text-gray-300'}`} />
                    ) : (
                      cellText(d, row)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 border-t ${border} px-6 py-3 text-sm ${muted}`}>
        <span>{result.total} {result.total === 1 ? 'record' : 'records'}</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1">
            Rows
            <select aria-label="Rows per page" value={pageSize} onChange={(e) => { setPageSize(+e.target.value); setPage(1); }} className="rounded border border-gray-300 bg-white px-1 py-0.5 text-gray-900">
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="button" aria-label="Previous page" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)} className="disabled:opacity-40">‹</button>
          <span>Page {result.page} of {result.pages}</span>
          <button type="button" aria-label="Next page" disabled={result.page >= result.pages} onClick={() => setPage(result.page + 1)} className="disabled:opacity-40">›</button>
        </div>
      </div>
    </div>
  );
};
