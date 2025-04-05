import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  StorageManager, 
  StorageLayer, 
  StorageEvent
} from '../../../../src/core/storage';

// Mock IndexedDB
const _indexedDBMock = {
  open: vi.fn().mockImplementation(() => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      transaction: vi.fn().mockImplementation(() => ({
        objectStore: vi.fn().mockImplementation(() => ({
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          clear: vi.fn(),
          getAllKeys: vi.fn(),
        })),
      })),
      createObjectStore: vi.fn(),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true),
      },
    },
  })),
};

// Mock storage implementation before tests
vi.mock('idb', () => ({
  openDB: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    getAllKeys: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    transaction: vi.fn().mockImplementation(() => ({
      store: {
        index: vi.fn().mockImplementation(() => ({
          openCursor: vi.fn().mockResolvedValue(null),
        })),
      },
    })),
  })),
}));

describe('StorageManager', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    // Create a fresh instance for each test
    storageManager = new StorageManager({
      useSessionStorage: true,
      useLocalStorage: true,
      useCloudStorage: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Storage', () => {
    it('should store and retrieve values from session storage', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-value' };

      await storageManager.set(testKey, testValue, StorageLayer.SESSION);
      const result = await storageManager.get(testKey, StorageLayer.SESSION);

      expect(result).toEqual(testValue);
    });

    it('should return null for non-existent keys', async () => {
      const result = await storageManager.get('non-existent-key', StorageLayer.SESSION);
      expect(result).toBeNull();
    });

    it('should remove values from session storage', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-value' };

      await storageManager.set(testKey, testValue, StorageLayer.SESSION);
      await storageManager.remove(testKey, StorageLayer.SESSION);
      const result = await storageManager.get(testKey, StorageLayer.SESSION);

      expect(result).toBeNull();
    });

    it('should check if a key exists in session storage', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-value' };

      await storageManager.set(testKey, testValue, StorageLayer.SESSION);
      const exists = await storageManager.has(testKey, StorageLayer.SESSION);

      expect(exists).toBe(true);
    });

    it('should clear all values from session storage', async () => {
      const testKey1 = 'test-key-1';
      const testKey2 = 'test-key-2';
      const testValue = { data: 'test-value' };

      await storageManager.set(testKey1, testValue, StorageLayer.SESSION);
      await storageManager.set(testKey2, testValue, StorageLayer.SESSION);
      await storageManager.clear(StorageLayer.SESSION);

      const result1 = await storageManager.get(testKey1, StorageLayer.SESSION);
      const result2 = await storageManager.get(testKey2, StorageLayer.SESSION);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners when an item is updated', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-value' };
      const listener = vi.fn();

      const removeListener = storageManager.addEventListener(StorageEvent.ITEM_UPDATED, listener);
      await storageManager.set(testKey, testValue);

      expect(listener).toHaveBeenCalledWith(StorageEvent.ITEM_UPDATED, testKey);

      // Cleanup
      removeListener();
    });

    it('should notify listeners when an item is removed', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-value' };
      const listener = vi.fn();

      await storageManager.set(testKey, testValue);
      const removeListener = storageManager.addEventListener(StorageEvent.ITEM_REMOVED, listener);
      await storageManager.remove(testKey);

      expect(listener).toHaveBeenCalledWith(StorageEvent.ITEM_REMOVED, testKey);

      // Cleanup
      removeListener();
    });

    it('should notify listeners when storage is cleared', async () => {
      const listener = vi.fn();

      const removeListener = storageManager.addEventListener(StorageEvent.STORAGE_CLEARED, listener);
      await storageManager.clear();

      expect(listener).toHaveBeenCalledWith(StorageEvent.STORAGE_CLEARED, undefined);

      // Cleanup
      removeListener();
    });
  });

  describe('Export/Import', () => {
    it('should export data in the expected format', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-value' };

      await storageManager.set(testKey, testValue, StorageLayer.LOCAL);
      const exportData = await storageManager.exportData();

      expect(exportData).toHaveProperty('version');
      expect(exportData).toHaveProperty('createdAt');
      expect(exportData).toHaveProperty('data');
      expect(exportData).toHaveProperty('metadata');
    });
  });
});