# Module Federation Configuration

This AI Calendar CRM app is configured for Module Federation, allowing it to be consumed as a remote module by other applications.

## Configuration Details

**Remote Name:** `CalendarApp`
**Entry Point:** `remoteEntry.js`
**URL:** https://calendar.smartcrm.vip/

## Exposed Modules

### 1. CalendarApp (`./CalendarApp`)
The complete standalone calendar application with all providers.

```tsx
import CalendarApp from 'CalendarApp/CalendarApp';

// Usage
<CalendarApp />
```

### 2. CalendarModule (`./CalendarModule`)
A modular component that can display different views based on mode.

```tsx
import CalendarModule from 'CalendarApp/CalendarModule';

// Usage
<CalendarModule mode="calendar" />
<CalendarModule mode="tasks" />
<CalendarModule mode="contacts" />
<CalendarModule mode="profile" />
```

### 3. App (`./App`)
The main App component without providers.

```tsx
import App from 'CalendarApp/App';
```

### 4. Individual Components

```tsx
import ContactsModal from 'CalendarApp/ContactsModal';
import TasksAndFunnel from 'CalendarApp/TasksAndFunnel';
import BigTaskCalendar from 'CalendarApp/BigTaskCalendar';
import CustomerProfile from 'CalendarApp/CustomerProfile';
```

## Shared Dependencies

The following packages are configured as singletons:
- `react` (^18.0.0)
- `react-dom` (^18.0.0)
- `react-router-dom` (^6.26.0)

## Host Application Setup

To consume this remote module in your host application:

### 1. Update your `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'HostApp',
      remotes: {
        CalendarApp: 'https://calendar.smartcrm.vip/assets/remoteEntry.js',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.26.0'
        }
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
```

### 2. Use the remote modules:

```tsx
import React, { lazy, Suspense } from 'react';

// Lazy load the calendar app
const CalendarApp = lazy(() => import('CalendarApp/CalendarApp'));
const CalendarModule = lazy(() => import('CalendarApp/CalendarModule'));

function App() {
  return (
    <Suspense fallback={<div>Loading Calendar...</div>}>
      {/* Full app */}
      <CalendarApp />

      {/* Or specific module */}
      <CalendarModule mode="calendar" />
    </Suspense>
  );
}
```

## Build Configuration

The app is built with the following settings:
- **Format:** SystemJS
- **Minification:** Disabled (for debugging)
- **CSS Code Split:** Disabled
- **Target:** ESNext

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

## Deployment

When deploying to https://calendar.smartcrm.vip/:

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder contents to your hosting

3. Ensure the `remoteEntry.js` file is accessible at:
   ```
   https://calendar.smartcrm.vip/assets/remoteEntry.js
   ```

4. Test the remote modules are loading correctly from the host application

## Troubleshooting

### Module Not Found
- Ensure the remoteEntry.js URL is correct
- Check network tab for 404 errors
- Verify CORS headers are set correctly

### Version Conflicts
- Ensure shared dependencies versions match between host and remote
- Use singleton: true for React packages
- Check console for version mismatch warnings

### Styles Not Loading
- Verify CSS is included in the build
- Check that cssCodeSplit is set to false
- Ensure styles are imported in the exposed components

## Support

For issues or questions about module federation integration:
- Check the build output for errors
- Verify all dependencies are installed
- Ensure Vite and plugin versions are compatible
- Review the browser console for runtime errors
