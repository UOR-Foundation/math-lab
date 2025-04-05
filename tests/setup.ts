import { vi } from 'vitest';

// Mock IndexedDB for tests
if (typeof indexedDB === 'undefined') {
  // Create a minimal mock of IndexedDB
  interface IDBDatabase {}
  interface IDBRequest {
    onupgradeneeded: null | (() => void);
    onsuccess: null | (() => void);
    onerror: null | (() => void);
    result?: IDBDatabase;
  }

  global.indexedDB = {
    open: vi.fn().mockReturnValue({
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null
    } as IDBRequest)
  };
}

// Mock navigator.hardwareConcurrency
if (typeof navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', {
    value: {
      hardwareConcurrency: 4,
    },
    writable: true,
  });
}

// Mock console methods
console.error = vi.fn();
console.warn = vi.fn();
console.log = vi.fn();