import React from 'react';
import { BigTaskCalendar } from './components/BigTaskCalendar';
import { TasksAndFunnel } from './components/TasksAndFunnel';
import { ContactsModal } from './components/ContactsModal';
import { CustomerProfile } from './components/CustomerProfile';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIProvider } from './contexts/AIContext';

export interface CalendarModuleProps {
  mode?: 'calendar' | 'tasks' | 'contacts' | 'profile';
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({ mode = 'calendar' }) => {
  return (
    <ThemeProvider>
      <AIProvider>
        <div className="w-full h-full">
          {mode === 'calendar' && <BigTaskCalendar />}
          {mode === 'tasks' && <TasksAndFunnel />}
          {mode === 'contacts' && <ContactsModal isOpen={true} onClose={() => {}} />}
          {mode === 'profile' && <CustomerProfile />}
        </div>
      </AIProvider>
    </ThemeProvider>
  );
};

export default CalendarModule;

export { BigTaskCalendar, TasksAndFunnel, ContactsModal, CustomerProfile };
