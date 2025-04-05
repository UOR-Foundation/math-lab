import { vi } from 'vitest';
import { mockIDB } from 'safari-14-idb-fix';

// Mock IndexedDB for tests
if (typeof indexedDB === 'undefined') {
  mockIDB();
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