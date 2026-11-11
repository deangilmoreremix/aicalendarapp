import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Edge functions import from `jsr:`; Vitest cannot resolve that scheme, so tests use stubs.
      { find: /^jsr:@supabase\/functions-js\/edge-runtime\.d\.ts$/, replacement: new URL('./src/test/stubs/edge-runtime.ts', import.meta.url).pathname },
      { find: /^jsr:@supabase\/supabase-js@2$/, replacement: new URL('./src/test/stubs/supabase-js-jsr.ts', import.meta.url).pathname },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})