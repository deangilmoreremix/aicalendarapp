import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'CRMCalendarApp',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
        './ContactsModal': './src/components/ContactsModal.tsx',
        './TasksAndFunnel': './src/components/TasksAndFunnel.tsx',
        './BigTaskCalendar': './src/components/BigTaskCalendar.tsx',
        './CustomerProfile': './src/components/CustomerProfile.tsx',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.3.1',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.26.0',
        },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    modulePreload: false,
  },
});
