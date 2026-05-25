# SmartCRM Calendar - True Module Federation Remote Guide (No Iframes)

**This is a complete, production federated microfrontend remote.**
It runs as a FULL application inside SmartCRM host using @originjs/vite-plugin-federation (NOT iframes, NOT wrappers).

See MODULE_FEDERATION.md for primary instructions.

## Quick Start (Federation)

Build produces fully functional remoteEntry.js exposing the complete app.

```bash
npm run build
npm run preview   # test standalone at localhost
```

For SmartCRM host integration use the MF config + `import('CalendarApp/App')` (see MODULE_FEDERATION.md).

### 2. Host Application Configuration

Add to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'HostApp',
      remotes: {
        crmApp: 'https://your-crm-domain.com/assets/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
      },
    }),
  ],
});
```

### 3. Import and Use Components

```typescript
import { lazy } from 'react';

// Lazy load the CRM components
const CRMApp = lazy(() => import('crmApp/App'));
const ContactsModal = lazy(() => import('crmApp/ContactsModal'));
const TaskCalendar = lazy(() => import('crmApp/BigTaskCalendar'));
const CustomerProfile = lazy(() => import('crmApp/CustomerProfile'));

function MyHostApp() {
  return (
    <Suspense fallback={<div>Loading CRM...</div>}>
      <CRMApp />
    </Suspense>
  );
}
```

## Exposed (Full App Primary)

- `./App` - **THE COMPLETE SMARTCRM-COMPATIBLE APPLICATION** (all features, routing, state, AI, etc.)
- Plus granular legacy components for incremental adoption (still 100% functional, no mocks)

## Communication API

### Sending Messages to Embedded App

```javascript
// Get the iframe reference
const iframe = document.getElementById('crm-iframe');

// Send theme configuration
iframe.contentWindow.postMessage({
  type: 'SET_THEME',
  data: {
    mode: 'dark',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    fontFamily: 'Inter, sans-serif'
  }
}, 'https://your-crm-domain.com');

// Send initial data
iframe.contentWindow.postMessage({
  type: 'INITIAL_DATA_SYNC',
  data: {
    contacts: [...],
    deals: [...],
    tasks: [...],
    appointments: [...],
    user: { id: '123', name: 'John Doe' }
  }
}, 'https://your-crm-domain.com');

// Send data updates
iframe.contentWindow.postMessage({
  type: 'DATA_UPDATE',
  data: {
    entityType: 'contact',
    operation: 'update',
    payload: { id: '123', name: 'Jane Doe', ... }
  }
}, 'https://your-crm-domain.com');
```

### Receiving Messages from Embedded App

```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://your-crm-domain.com') return;

  const { type, data } = event.data;

  switch (type) {
    case 'READY':
      console.log('CRM App is ready', data);
      break;

    case 'BUTTON_CLICK':
      console.log('Button clicked:', data.action);
      break;

    case 'DATA_CHANGE':
      console.log('Data changed:', data.changeType, data);
      break;

    case 'NAVIGATION_REQUEST':
      console.log('Navigation requested:', data.path);
      break;

    case 'HEIGHT_CHANGE':
      // Resize iframe
      iframe.style.height = data.height + 'px';
      break;

    case 'ERROR':
      console.error('CRM App error:', data.error, data.details);
      break;
  }
});
```

## Message Types

### Host → Embedded App

- `SET_THEME` - Update theme configuration
- `INITIAL_DATA_SYNC` - Sync initial data on load
- `DATA_UPDATE` - Update specific entity data
- `AUTH_STATUS` - Update authentication status
- `NAVIGATION` - Navigate to specific route
- `CONFIG_UPDATE` - Update app configuration

### Embedded App → Host

- `READY` - App is loaded and ready
- `BUTTON_CLICK` - User clicked a button
- `DATA_CHANGE` - Data was modified in the app
- `NAVIGATION_REQUEST` - App requests navigation
- `ERROR` - An error occurred
- `HEIGHT_CHANGE` - Content height changed

<!-- IFRAME EXAMPLE REMOVED: This remote is designed for true Module Federation only.
   Use the MF lazy import pattern from MODULE_FEDERATION.md instead of iframes.
   Iframes are explicitly not supported for SmartCRM integration. -->

## Security Considerations

1. **Origin Validation**: Always validate the origin of postMessage events
2. **Content Security Policy**: Configure CSP headers appropriately
3. **Authentication**: Handle authentication tokens securely
4. **Data Sanitization**: Sanitize all data passed between host and embedded app

## TypeScript Support

Import types for better type safety:

```typescript
import type {
  HostMessage,
  EmbeddedMessage,
  ThemeConfig,
  InitialDataSync
} from 'crmApp/utils/hostCommunication';
```

## Troubleshooting

### App not loading
- Check that `remoteEntry.js` is accessible
- Verify CORS headers are configured
- Check browser console for errors

### Messages not received
- Verify origin matching in both directions
- Check that iframe is fully loaded before sending messages
- Ensure postMessage target is correct

### Styling issues
- CSS may need to be scoped to avoid conflicts
- Use CSS modules or scoped styles
- Consider using Shadow DOM for complete isolation

## Development

To test embedding locally:

1. Build the app: `npm run build`
2. Serve the build: `npm run preview`
3. Create a test host app pointing to `http://localhost:4173`

## Production Deployment

1. Build: `npm run build`
2. Upload `dist` folder to your CDN
3. Update host applications to point to your CDN URL
4. Ensure CORS headers allow cross-origin requests
