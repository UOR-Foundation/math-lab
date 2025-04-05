/**
 * Storage system types for Math Lab
 */

/**
 * Generic storage interface for consistent API across storage layers
 */
export interface StorageProvider {
  /**
   * Get data by key
   * @param key Unique identifier for the stored data
   * @returns Promise resolving to the stored data or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set data by key
   * @param key Unique identifier for the data
   * @param value Data to store
   * @returns Promise resolving when operation completes
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove data by key
   * @param key Unique identifier for the data to remove
   * @returns Promise resolving when operation completes
   */
  remove(key: string): Promise<void>;

  /**
   * Check if key exists
   * @param key Unique identifier to check
   * @returns Promise resolving to boolean indicating if key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Get all keys
   * @returns Promise resolving to array of all keys
   */
  keys(): Promise<string[]>;

  /**
   * Clear all stored data
   * @returns Promise resolving when operation completes
   */
  clear(): Promise<void>;
}

/**
 * Storage error codes
 */
export enum StorageErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Storage error class
 */
export class StorageError extends Error {
  code: StorageErrorCode;
  
  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'StorageError';
  }
}

/**
 * Storage item metadata
 */
export interface StorageItemMetadata {
  createdAt: number;
  updatedAt: number;
  size: number;
  type?: string;
}

/**
 * Storage sync status
 */
export interface StorageSyncStatus {
  lastSyncTime: number | null;
  syncInProgress: boolean;
  syncError: Error | null;
}

/**
 * Storage events
 */
export enum StorageEvent {
  ITEM_ADDED = 'ITEM_ADDED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ITEM_REMOVED = 'ITEM_REMOVED',
  STORAGE_CLEARED = 'STORAGE_CLEARED',
  SYNC_STARTED = 'SYNC_STARTED',
  SYNC_COMPLETED = 'SYNC_COMPLETED',
  SYNC_FAILED = 'SYNC_FAILED',
}

/**
 * Storage export format
 */
export interface StorageExport {
  version: string;
  createdAt: number;
  data: Record<string, unknown>;
  metadata: Record<string, StorageItemMetadata>;
}