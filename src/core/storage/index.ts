/**
 * Storage system for Math Lab
 * 
 * This module provides a layered storage system for persisting data in Math Lab.
 * It includes:
 * - Session storage (in-memory)
 * - Local storage (IndexedDB)
 * - Cloud storage (optional)
 * - Storage manager for coordinating between layers
 * - Import/export functionality
 */

// Export types
export * from './types';
export type { CloudStorageConfig } from './cloud-storage';
export type { StorageManagerConfig } from './storage-manager';

// Export storage implementations
export { SessionStorageService } from './session-storage';
export { LocalStorageService } from './local-storage';
export { CloudStorageService } from './cloud-storage';

// Export storage manager
export { StorageManager, StorageLayer } from './storage-manager';

// Create and export singleton instance
import { StorageManager } from './storage-manager';

/**
 * Default storage manager instance
 * 
 * This is the main entry point for storage operations in the application.
 */
export const storageManager = new StorageManager({
  useSessionStorage: true,
  useLocalStorage: true,
  useCloudStorage: false,
});

export default storageManager;