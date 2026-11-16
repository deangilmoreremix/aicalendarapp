import { useEffect } from 'react';

import { useOpenRecordStore } from '../store/openRecordStore';
import { useTaskStore } from '../store/taskStore';
import { useContactStore } from '../store/contactStore';
import { TaskDetailsModal } from './TaskDetailsModal';
import { DealDetailsModal } from './ui/DealDetailsModal';
import { ContactDetailView } from './ContactDetailView';
import { CalendarEventComposerModal } from './calendar/CalendarEventComposerModal';

/** Renders the details view for whatever record was requested through useOpenRecordStore. */
export const OpenRecordHost = () => {
  const { target, close } = useOpenRecordStore();
  const tasks = useTaskStore((s) => s.tasks);
  const calendarEvents = useTaskStore((s) => s.calendarEvents);
  const contacts = useContactStore((s) => s.contacts);
  const updateContact = useContactStore((s) => s.updateContact);

  // a requested record that no longer exists (deleted) just closes
  const missing =
    !!target &&
    ((target.type === 'task' && !tasks[target.id]) ||
      (target.type === 'contact' && !contacts[target.id]) ||
      (target.type === 'event' && !calendarEvents.find((e) => e.id === target.id)));
  useEffect(() => {
    if (missing) close();
  }, [missing, close]);

  if (!target || missing) return null;

  switch (target.type) {
    case 'task':
      return <TaskDetailsModal task={tasks[target.id]} isOpen onClose={close} startInEditMode={false} />;
    case 'deal':
      return <DealDetailsModal isOpen dealId={target.id} onClose={close} />;
    case 'contact':
      return (
        <ContactDetailView
          contact={contacts[target.id]}
          isOpen
          onClose={close}
          onUpdate={async (id, updates) => {
            await updateContact(id, updates);
            return useContactStore.getState().contacts[id] ?? contacts[id];
          }}
        />
      );
    case 'event':
      return (
        <CalendarEventComposerModal
          isOpen
          editing={calendarEvents.find((e) => e.id === target.id)}
          context={{ targets: [] }}
          onClose={close}
          onCreated={() => undefined}
        />
      );
  }
};
