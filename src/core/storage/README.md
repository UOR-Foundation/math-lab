# Storage System

This module provides a layered storage system for Math Lab, implementing a persistent storage solution as described in the dashboard specification.

## Overview

The storage system consists of three storage layers:

1. **Session Storage**: In-memory storage that persists only for the current browser session
2. **Local Storage**: IndexedDB-based storage that persists across browser sessions
3. **Cloud Storage**: (Optional) Remote storage that synchronizes data across devices

The `StorageManager` class coordinates between these layers, providing a unified API for storage operations.

## Usage

### Basic Usage

```typescript
import { storageManager, StorageLayer } from '@/core/storage';

// Store data
await storageManager.set('myKey', { data: 'value' });

// Retrieve data
const data = await storageManager.get('myKey');

// Remove data
await storageManager.remove('myKey');

// Check if key exists
const exists = await storageManager.has('myKey');

// Clear all data
await storageManager.clear();
```

### Specifying Storage Layer

```typescript
import { storageManager, StorageLayer } from '@/core/storage';

// Store in session storage (in-memory, lost when browser is closed)
await storageManager.set('sessionKey', value, StorageLayer.SESSION);

// Store in local storage (persists across browser sessions)
await storageManager.set('localKey', value, StorageLayer.LOCAL);

// Store in cloud storage (if configured)
await storageManager.set('cloudKey', value, StorageLayer.CLOUD);
```

### React Hooks

The storage system provides React hooks for easier integration in components:

```typescript
import { useStorage, useSessionStorage, useLocalStorage } from '@/hooks/useStorage';

function MyComponent() {
  // Basic storage hook with custom layer
  const [value, setValue, loading, error] = useStorage('myKey', initialValue, StorageLayer.LOCAL);
  
  // Session storage hook (convenience wrapper)
  const [sessionValue, setSessionValue] = useSessionStorage('sessionKey', initialValue);
  
  // Local storage hook (convenience wrapper)
  const [localValue, setLocalValue] = useLocalStorage('localKey', initialValue);

  // Example usage
  const handleSave = () => {
    setValue({ newData: 'updated' })
      .then(() => console.log('Saved successfully'))
      .catch(error => console.error('Save failed', error));
  };

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <pre>{JSON.stringify(value, null, 2)}</pre>
          <button onClick={handleSave}>Save</button>
          {error && <p>Error: {error.message}</p>}
        </>
      )}
    </div>
  );
}
```

### Import/Export

The storage system supports exporting and importing data:

```typescript
import { storageManager, StorageLayer } from '@/core/storage';

// Export data
const exportData = await storageManager.exportData();
const downloadUrl = storageManager.createDownloadableExport(exportData);

// Create a download link
const link = document.createElement('a');
link.href = downloadUrl;
link.download = 'mathlab-export.json';
link.click();

// Later, import the data
const importData = await fetch('mathlab-export.json').then(res => res.json());
await storageManager.importData(importData, StorageLayer.LOCAL);
```

### Event Listeners

You can listen for storage events:

```typescript
import { storageManager, StorageEvent } from '@/core/storage';

// Listen for item updates
const removeListener = storageManager.addEventListener(
  StorageEvent.ITEM_UPDATED, 
  (event, key) => {
    console.log(`Item updated: ${key}`);
  }
);

// Later, remove the listener
removeListener();
```

## Error Handling

The storage system uses a custom `StorageError` class with error codes:

```typescript
import { storageManager, StorageErrorCode } from '@/core/storage';

try {
  await storageManager.set('myKey', value);
} catch (error) {
  if (error instanceof StorageError) {
    switch (error.code) {
      case StorageErrorCode.QUOTA_EXCEEDED:
        console.error('Storage quota exceeded');
        break;
      case StorageErrorCode.PERMISSION_DENIED:
        console.error('Permission denied');
        break;
      // Handle other error codes
      default:
        console.error('Storage error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Redux Integration

The storage system is integrated with Redux through a persistence middleware that automatically saves and loads the Redux store state:

```typescript
// This is already set up in src/store/index.ts
import { createPersistenceMiddleware } from '@/store/middleware/persistenceMiddleware';
import { StorageLayer } from '@/core/storage';

const persistConfig = {
  key: 'mathlab-state',
  whitelist: ['settings', 'workspace'],
  storageLayer: StorageLayer.LOCAL,
};

// Add to middleware
const middleware = getDefaultMiddleware().concat(
  createPersistenceMiddleware(persistConfig)
);
```

## Cloud Storage

Cloud storage is optional and requires configuration:

```typescript
import { StorageManager, CloudStorageConfig, StorageLayer } from '@/core/storage';

const cloudConfig: CloudStorageConfig = {
  apiEndpoint: 'https://api.example.com/storage',
  authToken: 'user-auth-token',
  syncInterval: 60000, // Sync every minute
  syncOnStartup: true,
};

const storageManager = new StorageManager({
  useSessionStorage: true,
  useLocalStorage: true,
  useCloudStorage: true,
  cloudConfig,
});

// Manually trigger sync
await storageManager.sync();
```