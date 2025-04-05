import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StorageProvider, StorageError, StorageErrorCode, StorageItemMetadata } from './types';

/**
 * Database schema for IndexedDB
 */
interface StorageDB extends DBSchema {
  items: {
    key: string;
    value: {
      key: string;
      value: unknown;
      metadata: StorageItemMetadata;
    };
    indexes: { 'by-updated': number };
  };
}

/**
 * Local storage service using IndexedDB
 * Provides persistent storage that remains even after browser is closed
 */
export class LocalStorageService implements StorageProvider {
  private dbName: string;
  private dbPromise: Promise<IDBPDatabase<StorageDB>>;
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'items';

  /**
   * Creates a new instance of LocalStorageService
   * @param dbName Database name to use (default: 'mathlab-storage')
   */
  constructor(dbName: string = 'mathlab-storage') {
    this.dbName = dbName;
    this.dbPromise = this.initDatabase();
  }

  /**
   * Initialize the IndexedDB database
   */
  private async initDatabase(): Promise<IDBPDatabase<StorageDB>> {
    try {
      return await openDB<StorageDB>(this.dbName, this.DB_VERSION, {
        upgrade: (db) => {
          // Create the object store if it doesn't exist
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
            // Create an index on the updatedAt metadata field for quick access to recently modified items
            store.createIndex('by-updated', 'metadata.updatedAt');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to initialize IndexedDB: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get data by key
   * @param key Unique identifier for the stored data
   * @returns Promise resolving to the stored data or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.dbPromise;
      const result = await db.get(this.STORE_NAME, key);
      
      if (!result) {
        return null;
      }
      
      return result.value as T;
    } catch (error) {
      console.error('IndexedDB get error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to get item with key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Set data by key
   * @param key Unique identifier for the data
   * @param value Data to store
   * @returns Promise resolving when operation completes
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.dbPromise;
      const now = Date.now();
      
      // Get existing item to update metadata if it exists
      const existingItem = await db.get(this.STORE_NAME, key);
      
      const metadata: StorageItemMetadata = {
        createdAt: existingItem?.metadata?.createdAt || now,
        updatedAt: now,
        size: JSON.stringify(value).length,
        type: typeof value,
      };
      
      await db.put(this.STORE_NAME, {
        key,
        value,
        metadata,
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
      // Check if this might be a quota exceeded error
      if (error instanceof DOMException && 
         (error.name === 'QuotaExceededError' || error.code === 22)) {
        throw new StorageError(
          StorageErrorCode.QUOTA_EXCEEDED,
          `Storage quota exceeded for key "${key}"`
        );
      }
      
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to set item with key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Remove data by key
   * @param key Unique identifier for the data to remove
   * @returns Promise resolving when operation completes
   */
  async remove(key: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.delete(this.STORE_NAME, key);
    } catch (error) {
      console.error('IndexedDB remove error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to remove item with key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if key exists
   * @param key Unique identifier to check
   * @returns Promise resolving to boolean indicating if key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const db = await this.dbPromise;
      const count = await db.count(this.STORE_NAME, key);
      return count > 0;
    } catch (error) {
      console.error('IndexedDB has error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to check if key "${key}" exists: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all keys
   * @returns Promise resolving to array of all keys
   */
  async keys(): Promise<string[]> {
    try {
      const db = await this.dbPromise;
      return await db.getAllKeys(this.STORE_NAME);
    } catch (error) {
      console.error('IndexedDB keys error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to get keys: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear all stored data
   * @returns Promise resolving when operation completes
   */
  async clear(): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.clear(this.STORE_NAME);
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to clear storage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get metadata for a specific item
   * @param key Unique identifier for the stored data
   * @returns Promise resolving to the metadata or null if not found
   */
  async getMetadata(key: string): Promise<StorageItemMetadata | null> {
    try {
      const db = await this.dbPromise;
      const result = await db.get(this.STORE_NAME, key);
      
      if (!result) {
        return null;
      }
      
      return result.metadata;
    } catch (error) {
      console.error('IndexedDB getMetadata error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to get metadata for key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get recently modified items
   * @param limit Maximum number of items to retrieve
   * @returns Promise resolving to array of recently modified items
   */
  async getRecentItems(limit: number = 10): Promise<string[]> {
    try {
      const db = await this.dbPromise;
      const index = db.transaction(this.STORE_NAME).store.index('by-updated');
      
      // Get keys in descending order of updatedAt
      let cursor = await index.openCursor(null, 'prev');
      const keys: string[] = [];
      
      let count = 0;
      while (cursor && count < limit) {
        keys.push(cursor.value.key);
        count++;
        cursor = await cursor.continue();
      }
      
      return keys;
    } catch (error) {
      console.error('IndexedDB getRecentItems error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to get recent items: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}