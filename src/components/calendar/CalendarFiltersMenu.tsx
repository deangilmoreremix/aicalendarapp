/**
 * Calendar filters: record types, status, owner and date range.
 * The filter model mirrors twentyhq/twenty view filters (a list of field filters applied to the visible records).
 * Twenty's filter engine is tied to its GraphQL metadata, so the predicate itself lives in unifiedCalendarRecords.ts.
 */
import { Filter } from 'lucide-react';

import { Button } from '../ui/button';
import { MenuPanel } from './MenuPanel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import type { CalendarViewFilters } from '../../services/api';
import { ALL_RECORD_TYPES, DATE_FIELD_OPTIONS, DEFAULT_FIELD_BY_TYPE, type UnifiedRecordType } from './unifiedCalendarRecords';

const TYPE_LABELS: Record<UnifiedRecordType, string> = { task: 'Tasks', deal: 'Deals', contact: 'Contacts', event: 'Events' };

type CalendarFiltersMenuProps = {
  filters: CalendarViewFilters;
  onFiltersChange: (filters: CalendarViewFilters) => void;
  visibleTypes: UnifiedRecordType[];
  onVisibleTypesChange: (types: UnifiedRecordType[]) => void;
  statusOptions: string[];
  assigneeOptions: { id: string; name: string }[];
  /** which date field places each record type on the calendar */
  fieldByType: Partial<Record<UnifiedRecordType, string>>;
  onFieldByTypeChange: (fieldByType: Partial<Record<UnifiedRecordType, string>>) => void;
};

const toggle = <T,>(list: T[] | undefined, value: T): T[] => {
  const current = list ?? [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
};

export const CalendarFiltersMenu = ({
  filters,
  onFiltersChange,
  visibleTypes,
  onVisibleTypesChange,
  statusOptions,
  assigneeOptions,
  fieldByType,
  onFieldByTypeChange
}: CalendarFiltersMenuProps) => {
  const activeCount =
    (filters.statuses?.length ?? 0) +
    (filters.assigneeIds?.length ?? 0) +
    (filters.dueDateRange?.from || filters.dueDateRange?.to ? 1 : 0) +
    (ALL_RECORD_TYPES.length - visibleTypes.length);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Filter calendar">
          <Filter className="mr-2 h-4 w-4" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <MenuPanel className="space-y-3 p-3 text-sm">
          <fieldset>
            <legend className="mb-1 font-medium text-gray-900 dark:text-gray-100">Show</legend>
            {ALL_RECORD_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 py-0.5">
                <input
                  type="checkbox"
                  checked={visibleTypes.includes(type)}
                  onChange={() => onVisibleTypesChange(toggle(visibleTypes, type))}
                />
                {TYPE_LABELS[type]}
              </label>
            ))}
          </fieldset>

          {statusOptions.length > 0 && (
            <fieldset>
              <legend className="mb-1 font-medium text-gray-900 dark:text-gray-100">Status</legend>
              <div className="max-h-28 overflow-y-auto">
                {statusOptions.map((status) => (
                  <label key={status} className="flex items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      checked={filters.statuses?.includes(status) ?? false}
                      onChange={() => onFiltersChange({ ...filters, statuses: toggle(filters.statuses, status) })}
                    />
                    {status}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {assigneeOptions.length > 0 && (
            <fieldset>
              <legend className="mb-1 font-medium text-gray-900 dark:text-gray-100">Owner (tasks)</legend>
              {assigneeOptions.map((a) => (
                <label key={a.id} className="flex items-center gap-2 py-0.5">
                  <input
                    type="checkbox"
                    checked={filters.assigneeIds?.includes(a.id) ?? false}
                    onChange={() => onFiltersChange({ ...filters, assigneeIds: toggle(filters.assigneeIds, a.id) })}
                  />
                  {a.name}
                </label>
              ))}
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-1 font-medium text-gray-900 dark:text-gray-100">Date range</legend>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                aria-label="From"
                value={filters.dueDateRange?.from ?? ''}
                onChange={(e) => onFiltersChange({ ...filters, dueDateRange: { ...filters.dueDateRange, from: e.target.value || undefined } })}
                className="rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="date"
                aria-label="To"
                value={filters.dueDateRange?.to ?? ''}
                onChange={(e) => onFiltersChange({ ...filters, dueDateRange: { ...filters.dueDateRange, to: e.target.value || undefined } })}
                className="rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 font-medium text-gray-900 dark:text-gray-100">Place on calendar by</legend>
            {ALL_RECORD_TYPES.filter((type) => DATE_FIELD_OPTIONS[type].length > 1).map((type) => (
              <label key={type} className="flex items-center justify-between gap-2 py-0.5">
                <span>{TYPE_LABELS[type]}</span>
                <select
                  aria-label={`${TYPE_LABELS[type]} date field`}
                  value={fieldByType[type] ?? DEFAULT_FIELD_BY_TYPE[type]}
                  onChange={(e) => onFieldByTypeChange({ ...fieldByType, [type]: e.target.value })}
                  className="rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                >
                  {DATE_FIELD_OPTIONS[type].map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onFiltersChange({});
              onVisibleTypesChange(ALL_RECORD_TYPES);
              onFieldByTypeChange({});
            }}
          >
            Clear filters
          </Button>
        </MenuPanel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
