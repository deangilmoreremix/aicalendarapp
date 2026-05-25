# SmartCRM Module Federation Remote - Full Application

This is a **production-ready, fully functional SmartCRM Module Federation remote application**.

**CRITICAL:** This is NOT an iframe, NOT a shell, NOT partial. It is the COMPLETE AI Calendar CRM application loadable inside SmartCRM host via true Module Federation.

## Bootstrap Architecture (REQUIRED PATTERN)

- `main.tsx` - dynamically imports bootstrap (never renders directly)
- `bootstrap.tsx` - mounts ReactDOM + loads App
- `App.tsx` - exports ONLY the full self-contained application component (with internal providers + router). NO ReactDOM here.

This ensures:
- Runs 100% standalone (`npm run dev`)
- Loads fully inside SmartCRM host: `const RemoteApp = lazy(() => import('CalendarApp/App')); <RemoteApp />`

## Configuration Details

**Remote Name:** `CalendarApp`
**Entry Point:** `remoteEntry.js`
**Deployment URL:** https://calendar.smartcrm.vip/

## Exposed Modules

### Primary: Full Application
```tsx
import App from 'CalendarApp/App';

// Full working CRM - all pages, features, AI, editors, uploads, realtime, etc. preserved
<Suspense fallback={<div>Loading SmartCRM Calendar...</div>}>
  <App />
</Suspense>
```

### Legacy / Granular (still fully functional, no placeholders)
- `./CalendarApp`
- `./CalendarModule`
- `./ContactsModal`, `./TasksAndFunnel`, `./BigTaskCalendar`, `./CustomerProfile`
```

## Shared Dependencies (SmartCRM Compatible Singletons)

```js
shared: {
  react: { singleton: true, eager: true, requiredVersion: '^18.2.0' },
  'react-dom': { singleton: true, eager: true, requiredVersion: '^18.2.0' },
  'react-router-dom': { singleton: true, eager: true }
}
```

All React singletons + router to safely coexist inside SmartCRM provider tree without duplication conflicts.
Zustand stores and internal contexts (Theme, AI, Error) are self-contained inside the remote.

## SmartCRM Host Application Setup (True Federation - No Iframes)

### 1. Host `vite.config.ts` (SmartCRM Host)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'SmartCRMHost',
      remotes: {
        CalendarApp: 'https://calendar.smartcrm.vip/assets/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.2.0' },
        'react-router-dom': { singleton: true, eager: true },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
```

**IMPORTANT for SmartCRM host before loading remote:**
```ts
// Set global flag so remote detects SmartCRM embedded mode (enables MemoryRouter + auth sync)
(window as any).__SMARTCRM_HOST__ = true;
```

### 2. Consume the FULL application (recommended):

```tsx
import React, { lazy, Suspense } from 'react';

const RemoteCRMApp = lazy(() => import('CalendarApp/App'));

function SmartCRMPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading SmartCRM Calendar Module...</div>}>
      <RemoteCRMApp />
    </Suspense>
  );
}
```

- All original features, UI, business logic, AI tools, editors, uploads, realtime, Supabase, Zustand stores preserved 100%.
- Routing uses MemoryRouter automatically when embedded (no host history pollution).
- Auth sharing supported via postMessage AUTH_STATUS { access_token, refresh_token } or token.

This remote runs identically standalone or federated.

## Build Configuration & Folder Structure

- Remote always exposes complete working app (no shells/placeholders)
- Folder structure: src/App.tsx + bootstrap.tsx + main.tsx (dynamic) + routes/ + pages/ + components/ + services/ + store/ + hooks/ + utils/
- Build uses cssCodeSplit: false + esnext target for reliable MF CSS/JS loading
- Post-build step ensures remoteEntry.js available at root + /assets/

## CORS Configuration

The development server is configured with CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Environment Variables

Make sure the following environment variables are set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key (optional)
VITE_GEMINI_API_KEY=your_gemini_key (optional)
```

## Features Included

When consuming this module, you get access to:

### AI-Powered Features
- Contact scoring and enrichment
- Task generation with natural language
- Deal prediction and analysis
- Meeting optimization
- Social media profile discovery
- Real-time streaming AI responses

### Core Components
- Interactive calendar view
- Kanban task board
- Contact management
- Deal pipeline
- Customer profiles
- Activity feeds

### Data Persistence
- Supabase integration for all data
- Real-time updates
- Row-level security
- Edge function support

## Testing the Integration

1. **Build the remote app:**
   ```bash
   npm run build
   ```

2. **Serve the built files:**
   ```bash
   npm run preview
   ```

3. **Access remoteEntry.js:**
   Visit `http://localhost:4173/assets/remoteEntry.js` to verify it's accessible.

4. **Check exposed modules:**
   All exposed modules should be listed in the remoteEntry.js file.

## Deployment for SmartCRM

1. `npm run build`
2. Upload dist/ (remoteEntry.js must be served with CORS)
3. Host loads from the remoteEntry URL using the MF config above.
4. For standalone testing: `npm run preview` then visit directly.

## Troubleshooting

- **Remote fails to render in host**: Confirm host sets `window.__SMARTCRM_HOST__ = true` BEFORE the dynamic import. Check shared versions match exactly.
- **Router issues / double history**: Remote auto-switches to MemoryRouter in embedded mode.
- **Missing styles**: cssCodeSplit:false + full CSS in build.
- **Auth not shared**: Host must postMessage type:'AUTH_STATUS' with tokens before/after mount.
- **Standalone works but embedded broken**: Verify no duplicate React instances (singleton + eager required).
- Always test both `npm run dev` (standalone) + host MF load.

## Support

For issues or questions about module federation integration:
- Check the build output for errors
- Verify all dependencies are installed
- Ensure Vite and plugin versions are compatible
- Review the browser console for runtime errors
