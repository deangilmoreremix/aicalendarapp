import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIProvider } from './contexts/AIContext';

export { default } from './CalendarApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AIProvider>
        <App />
      </AIProvider>
    </ThemeProvider>
  </StrictMode>
);
