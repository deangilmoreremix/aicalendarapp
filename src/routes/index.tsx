import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Centralized route definitions for the SmartCRM remote.
// Preserves the original full application experience (all features/UI/logic).
// The main App (exported for federation) already includes routing + complete dashboard.
// This file provides explicit route map for future decomposition into pages/ without losing any functionality.

import { CalendarPage, KanbanPage, TasksPage, ActivityPage } from '../pages';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CalendarPage />} />
      <Route path="/dashboard" element={<CalendarPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/kanban" element={<KanbanPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
