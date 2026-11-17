/**
 * Ours (glue; Twenty: RecordCalendarAddNew): clicking an empty day offers to create something on that day.
 * Same panel style as the record context menu.
 */
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { CalendarPlus, ListChecks, UserCheck } from 'lucide-react';

import type { Contact } from '../../types';

export type SlotChoice = 'task' | 'event' | 'followup';

export const SlotChooser = ({
  day,
  position,
  contacts,
  onChoose,
  onFollowUp,
  onClose
}: {
  day: Date;
  position: { x: number; y: number };
  contacts: Contact[];
  onChoose: (choice: 'task' | 'event') => void;
  onFollowUp: (contactId: string) => void;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pickingContact, setPickingContact] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const left = Math.max(8, Math.min(position.x, window.innerWidth - 232));
  const top = Math.max(8, Math.min(position.y, window.innerHeight - 180));
  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700';

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={`Create on ${format(day, 'MMMM d')}`}
      style={{ position: 'fixed', top, left }}
      className="z-50 w-56 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <p className="px-3 py-1 text-xs font-medium text-gray-500">{format(day, 'EEEE, MMMM d')}</p>
      {pickingContact ? (
        <div className="px-3 py-2">
          <label className="block text-xs text-gray-600 dark:text-gray-300">
            Follow up with
            <select
              autoFocus
              aria-label="Contact for follow-up"
              defaultValue=""
              onChange={(e) => e.target.value && onFollowUp(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="" disabled>
                Choose a contact…
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <>
          <button type="button" role="menuitem" className={item} onClick={() => onChoose('task')}>
            <ListChecks className="h-4 w-4" /> New task
          </button>
          <button type="button" role="menuitem" className={item} onClick={() => onChoose('event')}>
            <CalendarPlus className="h-4 w-4" /> New event
          </button>
          <button type="button" role="menuitem" className={item} onClick={() => setPickingContact(true)}>
            <UserCheck className="h-4 w-4" /> Contact follow-up
          </button>
        </>
      )}
    </div>
  );
};
