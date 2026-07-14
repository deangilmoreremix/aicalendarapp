import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIProvider } from './contexts/AIContext';
import { ErrorProvider } from './contexts/ErrorContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ErrorProvider>
        <ThemeProvider>
          <AIProvider>
            <App />
          </AIProvider>
        </ThemeProvider>
      </ErrorProvider>
    </ErrorBoundary>
  </StrictMode>
);
