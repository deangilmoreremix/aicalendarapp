/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarEventNotSharedContent.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { Lock } from 'lucide-react';

export const CalendarEventNotSharedContent = () => (
  <div className="flex h-6 w-full items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1 text-sm font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800">
    <Lock size={14} />
    Not shared
  </div>
);
