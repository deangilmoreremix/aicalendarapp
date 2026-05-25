import { lazy } from 'react';

// Page-level exports for SmartCRM routes (future expansion / sub-routing)
// All pages preserve original full functionality by composing existing battle-tested components.

export const CalendarPage = lazy(() => import('../components/BigTaskCalendar').then(m => ({ default: m.BigTaskCalendar })));
export const KanbanPage = lazy(() => import('../components/TaskKanbanBoard').then(m => ({ default: m.TaskKanbanBoard })));
export const ActivityPage = lazy(() => import('../components/ActivityFeed').then(m => ({ default: m.ActivityFeed })));
export const TasksPage = lazy(() => import('../components/TasksAndFunnel').then(m => ({ default: m.TasksAndFunnel })));
export const ContactsPage = lazy(() => import('../components/ContactsModal').then(m => ({ default: m.ContactsModal })));
export const ProfilePage = lazy(() => import('../components/CustomerProfile').then(m => ({ default: m.CustomerProfile })));
