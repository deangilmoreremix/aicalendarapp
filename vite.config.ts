import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// Module Federation Configuration for AI Calendar App
// https://calendar.smartcrm.vip/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'CalendarApp',
      filename: 'remoteEntry.js',
      exposes: {
        './CalendarApp': './src/CalendarApp.tsx',
        './CalendarModule': './src/CalendarModule.tsx',
        './ContactsModal': './src/remote/ContactsModal.tsx',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
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
    minify: true,
    cssCodeSplit: false,
    modulePreload: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },
});
