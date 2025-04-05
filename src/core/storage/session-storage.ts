import { StorageProvider, StorageError, StorageErrorCode } from './types';

/**
 * In-memory storage service for session data
 * Provides temporary storage that persists only for the current session
 */
export class SessionStorageService implements StorageProvider {
  private storage: Map<string, unknown> = new Map();

  /**
   * Get data by key
   * @param key Unique identifier for the stored data
   * @returns Promise resolving to the stored data or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.storage.has(key)) {
        return null;
      }
      return this.storage.get(key) as T;
    } catch (error) {
      console.error('Session storage get error:', error);
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
      this.storage.set(key, value);
    } catch (error) {
      console.error('Session storage set error:', error);
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
      this.storage.delete(key);
    } catch (error) {
      console.error('Session storage remove error:', error);
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
    return this.storage.has(key);
  }

  /**
   * Get all keys
   * @returns Promise resolving to array of all keys
   */
  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  /**
   * Clear all stored data
   * @returns Promise resolving when operation completes
   */
  async clear(): Promise<void> {
    this.storage.clear();
  }
}