/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarEventsEmptyState.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { CalendarPlus } from 'lucide-react';

type CalendarEventsEmptyStateProps = {
  objectName: string;
  onCreateEvent?: () => void;
};

export const CalendarEventsEmptyState = ({ objectName, onCreateEvent }: CalendarEventsEmptyStateProps) => (
  <div className="flex flex-col items-center gap-4 rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Events</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        No events have been scheduled with this {objectName} yet.
      </p>
    </div>
    {onCreateEvent && (
      <button
        type="button"
        onClick={onCreateEvent}
        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
      >
        <CalendarPlus className="mr-2 h-4 w-4" />
        New event
      </button>
    )}
  </div>
);
