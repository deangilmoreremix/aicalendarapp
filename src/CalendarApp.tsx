import React from 'react';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIProvider } from './contexts/AIContext';

export const CalendarApp: React.FC = () => {
  return (
    <ThemeProvider>
      <AIProvider>
        <App />
      </AIProvider>
    </ThemeProvider>
  );
};

export default CalendarApp;
