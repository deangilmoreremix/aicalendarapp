/**
 * Ours (glue): "Import / Export" menu of the calendar toolbar: download the events in view as an .ics file, or import one.
 */
import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '../ui/button';
import { MenuPanel } from './MenuPanel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ImportCalendarDialog } from './ImportCalendarDialog';

type Props = {
  /** the number of events that would be exported (the calendar's loaded range) */
  exportCount: number;
  onExport: () => void;
  onImported: () => void;
};

export const CalendarDataMenu = ({ exportCount, onExport, onImported }: Props) => {
  const [importOpen, setImportOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Import / Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <MenuPanel className="space-y-1 p-2 text-sm">
            <button
              type="button"
              disabled={exportCount === 0}
              onClick={onExport}
              className="block w-full rounded px-2 py-1.5 text-left text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Export events in view (.ics)
              <span className="block text-xs text-gray-500">{exportCount === 0 ? 'No events in this range' : `${exportCount} event${exportCount === 1 ? '' : 's'}`}</span>
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="block w-full rounded px-2 py-1.5 text-left text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Import from .ics file...
            </button>
          </MenuPanel>
        </DropdownMenuContent>
      </DropdownMenu>
      <ImportCalendarDialog isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={onImported} />
    </>
  );
};
