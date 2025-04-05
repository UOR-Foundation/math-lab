import { StorageProvider, StorageError, StorageErrorCode, StorageEvent, StorageExport } from './types';
import { SessionStorageService } from './session-storage';
import { LocalStorageService } from './local-storage';
import { CloudStorageService, CloudStorageConfig } from './cloud-storage';

/**
 * Storage manager configuration
 */
export interface StorageManagerConfig {
  /** Whether to use session storage */
  useSessionStorage?: boolean;
  /** Whether to use local storage */
  useLocalStorage?: boolean;
  /** Whether to use cloud storage */
  useCloudStorage?: boolean;
  /** Cloud storage configuration */
  cloudConfig?: CloudStorageConfig;
  /** Default database name for local storage */
  dbName?: string;
}

/**
 * Default storage manager configuration
 */
const DEFAULT_CONFIG: StorageManagerConfig = {
  useSessionStorage: true,
  useLocalStorage: true,
  useCloudStorage: false,
  dbName: 'mathlab-storage',
};

/**
 * Types of storage layers
 */
export enum StorageLayer {
  SESSION = 'session',
  LOCAL = 'local',
  CLOUD = 'cloud',
}

/**
 * Event listener type
 */
type StorageEventListener = (event: StorageEvent, key?: string) => void;

/**
 * Storage Manager
 * 
 * Coordinates between different storage layers (session, local, and cloud)
 * and provides a unified API for storage operations
 */
export class StorageManager implements StorageProvider {
  private config: StorageManagerConfig;
  private sessionStorage: SessionStorageService | null = null;
  private localStorage: LocalStorageService | null = null;
  private cloudStorage: CloudStorageService | null = null;
  private eventListeners: Map<StorageEvent, Set<StorageEventListener>> = new Map();

  /**
   * Creates a new instance of StorageManager
   * @param config Configuration options
   */
  constructor(config: StorageManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  /**
   * Initialize storage providers based on configuration
   */
  private initialize(): void {
    // Initialize session storage if enabled
    if (this.config.useSessionStorage) {
      this.sessionStorage = new SessionStorageService();
    }
    
    // Initialize local storage if enabled
    if (this.config.useLocalStorage) {
      this.localStorage = new LocalStorageService(this.config.dbName);
    }
    
    // Initialize cloud storage if enabled
    if (this.config.useCloudStorage && this.localStorage) {
      this.cloudStorage = new CloudStorageService(
        this.localStorage,
        this.config.cloudConfig
      );
    }
  }

  /**
   * Get data by key
   * Tries to get data from session storage first, then local, then cloud
   * @param key Unique identifier for the stored data
   * @param layer Specific storage layer to use (optional)
   * @returns Promise resolving to the stored data or null if not found
   */
  async get<T>(key: string, layer?: StorageLayer): Promise<T | null> {
    try {
      // If a specific layer is requested, use only that layer
      if (layer) {
        return this.getFromLayer<T>(key, layer);
      }
      
      // Otherwise, try each layer in order of speed (session -> local -> cloud)
      let result: T | null = null;
      
      // Try session storage first (fastest)
      if (this.sessionStorage) {
        result = await this.sessionStorage.get<T>(key);
        if (result !== null) {
          return result;
        }
      }
      
      // Then try local storage
      if (this.localStorage) {
        result = await this.localStorage.get<T>(key);
        if (result !== null) {
          // Cache in session storage for faster future access
          if (this.sessionStorage) {
            await this.sessionStorage.set(key, result);
          }
          return result;
        }
      }
      
      // Finally try cloud storage (same as local in this implementation)
      if (this.cloudStorage) {
        result = await this.cloudStorage.get<T>(key);
        if (result !== null) {
          // Cache in session and local storage for faster future access
          if (this.sessionStorage) {
            await this.sessionStorage.set(key, result);
          }
          if (this.localStorage) {
            await this.localStorage.set(key, result);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Storage manager get error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to get item with key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get data from a specific storage layer
   * @param key Unique identifier for the stored data
   * @param layer Storage layer to use
   * @returns Promise resolving to the stored data or null if not found
   */
  private async getFromLayer<T>(key: string, layer: StorageLayer): Promise<T | null> {
    switch (layer) {
      case StorageLayer.SESSION:
        if (!this.sessionStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Session storage is not available'
          );
        }
        return this.sessionStorage.get<T>(key);
        
      case StorageLayer.LOCAL:
        if (!this.localStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Local storage is not available'
          );
        }
        return this.localStorage.get<T>(key);
        
      case StorageLayer.CLOUD:
        if (!this.cloudStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Cloud storage is not available'
          );
        }
        return this.cloudStorage.get<T>(key);
        
      default:
        throw new StorageError(
          StorageErrorCode.UNKNOWN_ERROR,
          `Unknown storage layer: ${layer}`
        );
    }
  }

  /**
   * Set data by key
   * Sets data in all available storage layers
   * @param key Unique identifier for the data
   * @param value Data to store
   * @param layer Specific storage layer to use (optional)
   * @returns Promise resolving when operation completes
   */
  async set<T>(key: string, value: T, layer?: StorageLayer): Promise<void> {
    try {
      // If a specific layer is requested, use only that layer
      if (layer) {
        await this.setInLayer(key, value, layer);
        this.emitEvent(StorageEvent.ITEM_UPDATED, key);
        return;
      }
      
      // Otherwise, set in all available layers
      const promises: Promise<void>[] = [];
      
      if (this.sessionStorage) {
        promises.push(this.sessionStorage.set(key, value));
      }
      
      if (this.localStorage) {
        promises.push(this.localStorage.set(key, value));
      }
      
      if (this.cloudStorage) {
        promises.push(this.cloudStorage.set(key, value));
      }
      
      await Promise.all(promises);
      this.emitEvent(StorageEvent.ITEM_UPDATED, key);
    } catch (error) {
      console.error('Storage manager set error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to set item with key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Set data in a specific storage layer
   * @param key Unique identifier for the data
   * @param value Data to store
   * @param layer Storage layer to use
   * @returns Promise resolving when operation completes
   */
  private async setInLayer<T>(key: string, value: T, layer: StorageLayer): Promise<void> {
    switch (layer) {
      case StorageLayer.SESSION:
        if (!this.sessionStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Session storage is not available'
          );
        }
        return this.sessionStorage.set(key, value);
        
      case StorageLayer.LOCAL:
        if (!this.localStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Local storage is not available'
          );
        }
        return this.localStorage.set(key, value);
        
      case StorageLayer.CLOUD:
        if (!this.cloudStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Cloud storage is not available'
          );
        }
        return this.cloudStorage.set(key, value);
        
      default:
        throw new StorageError(
          StorageErrorCode.UNKNOWN_ERROR,
          `Unknown storage layer: ${layer}`
        );
    }
  }

  /**
   * Remove data by key
   * Removes data from all available storage layers
   * @param key Unique identifier for the data to remove
   * @param layer Specific storage layer to use (optional)
   * @returns Promise resolving when operation completes
   */
  async remove(key: string, layer?: StorageLayer): Promise<void> {
    try {
      // If a specific layer is requested, use only that layer
      if (layer) {
        await this.removeFromLayer(key, layer);
        this.emitEvent(StorageEvent.ITEM_REMOVED, key);
        return;
      }
      
      // Otherwise, remove from all available layers
      const promises: Promise<void>[] = [];
      
      if (this.sessionStorage) {
        promises.push(this.sessionStorage.remove(key));
      }
      
      if (this.localStorage) {
        promises.push(this.localStorage.remove(key));
      }
      
      if (this.cloudStorage) {
        promises.push(this.cloudStorage.remove(key));
      }
      
      await Promise.all(promises);
      this.emitEvent(StorageEvent.ITEM_REMOVED, key);
    } catch (error) {
      console.error('Storage manager remove error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to remove item with key "${key}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Remove data from a specific storage layer
   * @param key Unique identifier for the data to remove
   * @param layer Storage layer to use
   * @returns Promise resolving when operation completes
   */
  private async removeFromLayer(key: string, layer: StorageLayer): Promise<void> {
    switch (layer) {
      case StorageLayer.SESSION:
        if (!this.sessionStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Session storage is not available'
          );
        }
        return this.sessionStorage.remove(key);
        
      case StorageLayer.LOCAL:
        if (!this.localStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Local storage is not available'
          );
        }
        return this.localStorage.remove(key);
        
      case StorageLayer.CLOUD:
        if (!this.cloudStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Cloud storage is not available'
          );
        }
        return this.cloudStorage.remove(key);
        
      default:
        throw new StorageError(
          StorageErrorCode.UNKNOWN_ERROR,
          `Unknown storage layer: ${layer}`
        );
    }
  }

  /**
   * Check if key exists
   * Checks all available storage layers
   * @param key Unique identifier to check
   * @param layer Specific storage layer to check (optional)
   * @returns Promise resolving to boolean indicating if key exists
   */
  async has(key: string, layer?: StorageLayer): Promise<boolean> {
    try {
      // If a specific layer is requested, check only that layer
      if (layer) {
        return this.hasInLayer(key, layer);
      }
      
      // Otherwise, check all available layers
      if (this.sessionStorage && await this.sessionStorage.has(key)) {
        return true;
      }
      
      if (this.localStorage && await this.localStorage.has(key)) {
        return true;
      }
      
      if (this.cloudStorage && await this.cloudStorage.has(key)) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Storage manager has error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to check if key "${key}" exists: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if key exists in a specific storage layer
   * @param key Unique identifier to check
   * @param layer Storage layer to check
   * @returns Promise resolving to boolean indicating if key exists
   */
  private async hasInLayer(key: string, layer: StorageLayer): Promise<boolean> {
    switch (layer) {
      case StorageLayer.SESSION:
        if (!this.sessionStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Session storage is not available'
          );
        }
        return this.sessionStorage.has(key);
        
      case StorageLayer.LOCAL:
        if (!this.localStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Local storage is not available'
          );
        }
        return this.localStorage.has(key);
        
      case StorageLayer.CLOUD:
        if (!this.cloudStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Cloud storage is not available'
          );
        }
        return this.cloudStorage.has(key);
        
      default:
        throw new StorageError(
          StorageErrorCode.UNKNOWN_ERROR,
          `Unknown storage layer: ${layer}`
        );
    }
  }

  /**
   * Get all keys
   * Gets keys from all available storage layers and deduplicates
   * @param layer Specific storage layer to use (optional)
   * @returns Promise resolving to array of all keys
   */
  async keys(layer?: StorageLayer): Promise<string[]> {
    try {
      // If a specific layer is requested, get keys from only that layer
      if (layer) {
        return this.keysFromLayer(layer);
      }
      
      // Otherwise, get keys from all available layers and deduplicate
      const keySet = new Set<string>();
      
      if (this.sessionStorage) {
        const sessionKeys = await this.sessionStorage.keys();
        sessionKeys.forEach(key => keySet.add(key));
      }
      
      if (this.localStorage) {
        const localKeys = await this.localStorage.keys();
        localKeys.forEach(key => keySet.add(key));
      }
      
      if (this.cloudStorage) {
        const cloudKeys = await this.cloudStorage.keys();
        cloudKeys.forEach(key => keySet.add(key));
      }
      
      return Array.from(keySet);
    } catch (error) {
      console.error('Storage manager keys error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to get keys: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get keys from a specific storage layer
   * @param layer Storage layer to use
   * @returns Promise resolving to array of keys
   */
  private async keysFromLayer(layer: StorageLayer): Promise<string[]> {
    switch (layer) {
      case StorageLayer.SESSION:
        if (!this.sessionStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Session storage is not available'
          );
        }
        return this.sessionStorage.keys();
        
      case StorageLayer.LOCAL:
        if (!this.localStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Local storage is not available'
          );
        }
        return this.localStorage.keys();
        
      case StorageLayer.CLOUD:
        if (!this.cloudStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Cloud storage is not available'
          );
        }
        return this.cloudStorage.keys();
        
      default:
        throw new StorageError(
          StorageErrorCode.UNKNOWN_ERROR,
          `Unknown storage layer: ${layer}`
        );
    }
  }

  /**
   * Clear all stored data
   * Clears all available storage layers
   * @param layer Specific storage layer to clear (optional)
   * @returns Promise resolving when operation completes
   */
  async clear(layer?: StorageLayer): Promise<void> {
    try {
      // If a specific layer is requested, clear only that layer
      if (layer) {
        await this.clearLayer(layer);
        this.emitEvent(StorageEvent.STORAGE_CLEARED);
        return;
      }
      
      // Otherwise, clear all available layers
      const promises: Promise<void>[] = [];
      
      if (this.sessionStorage) {
        promises.push(this.sessionStorage.clear());
      }
      
      if (this.localStorage) {
        promises.push(this.localStorage.clear());
      }
      
      if (this.cloudStorage) {
        promises.push(this.cloudStorage.clear());
      }
      
      await Promise.all(promises);
      this.emitEvent(StorageEvent.STORAGE_CLEARED);
    } catch (error) {
      console.error('Storage manager clear error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to clear storage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear a specific storage layer
   * @param layer Storage layer to clear
   * @returns Promise resolving when operation completes
   */
  private async clearLayer(layer: StorageLayer): Promise<void> {
    switch (layer) {
      case StorageLayer.SESSION:
        if (!this.sessionStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Session storage is not available'
          );
        }
        return this.sessionStorage.clear();
        
      case StorageLayer.LOCAL:
        if (!this.localStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Local storage is not available'
          );
        }
        return this.localStorage.clear();
        
      case StorageLayer.CLOUD:
        if (!this.cloudStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Cloud storage is not available'
          );
        }
        return this.cloudStorage.clear();
        
      default:
        throw new StorageError(
          StorageErrorCode.UNKNOWN_ERROR,
          `Unknown storage layer: ${layer}`
        );
    }
  }

  /**
   * Sync with cloud storage
   * @returns Promise resolving when sync completes
   */
  async sync(): Promise<void> {
    if (!this.cloudStorage) {
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        'Cloud storage is not available'
      );
    }
    
    try {
      this.emitEvent(StorageEvent.SYNC_STARTED);
      await this.cloudStorage.sync();
      this.emitEvent(StorageEvent.SYNC_COMPLETED);
    } catch (error) {
      this.emitEvent(StorageEvent.SYNC_FAILED);
      throw error;
    }
  }

  /**
   * Export storage data to a file
   * @param layer Storage layer to export (defaults to LOCAL)
   * @returns Promise resolving to export data
   */
  async exportData(layer: StorageLayer = StorageLayer.LOCAL): Promise<StorageExport> {
    try {
      const provider = this.getProviderForLayer(layer);
      const keys = await provider.keys();
      const data: Record<string, unknown> = {};
      
      // Get all data for the keys
      for (const key of keys) {
        data[key] = await provider.get(key);
      }
      
      // Create export object
      const exportData: StorageExport = {
        version: '1.0.0',
        createdAt: Date.now(),
        data,
        metadata: {}, // In a real implementation, we would include metadata for each item
      };
      
      return exportData;
    } catch (error) {
      console.error('Storage export error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to export data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate a downloadable file from export data
   * @param exportData Export data
   * @param filename Filename to use (default: 'mathlab-export.json')
   * @returns URL object for the downloadable file
   */
  createDownloadableExport(exportData: StorageExport, _filename: string = 'mathlab-export.json'): string {
    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Export file creation error:', error);
      throw new StorageError(
        StorageErrorCode.SERIALIZATION_ERROR,
        `Failed to create export file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Import data from export file
   * @param exportData Export data to import
   * @param layer Storage layer to import to (defaults to LOCAL)
   * @param overwrite Whether to overwrite existing data (default: false)
   * @returns Promise resolving when import completes
   */
  async importData(
    exportData: StorageExport,
    layer: StorageLayer = StorageLayer.LOCAL,
    overwrite: boolean = false
  ): Promise<void> {
    try {
      // Validate export data
      if (!exportData.version || !exportData.data) {
        throw new StorageError(
          StorageErrorCode.SERIALIZATION_ERROR,
          'Invalid export data format'
        );
      }
      
      const provider = this.getProviderForLayer(layer);
      
      // Import each key
      for (const [key, value] of Object.entries(exportData.data)) {
        // Check if key exists and skip if not overwriting
        if (!overwrite && await provider.has(key)) {
          continue;
        }
        
        await provider.set(key, value);
      }
      
      this.emitEvent(StorageEvent.ITEM_UPDATED);
    } catch (error) {
      console.error('Storage import error:', error);
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to import data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get storage provider for a specific layer
   * @param layer Storage layer
   * @returns Storage provider
   */
  private getProviderForLayer(layer: StorageLayer): StorageProvider {
    switch (layer) {
      case StorageLayer.SESSION:
        if (!this.sessionStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Session storage is not available'
          );
        }
        return this.sessionStorage;
        
      case StorageLayer.LOCAL:
        if (!this.localStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Local storage is not available'
          );
        }
        return this.localStorage;
        
      case StorageLayer.CLOUD:
        if (!this.cloudStorage) {
          throw new StorageError(
            StorageErrorCode.UNKNOWN_ERROR,
            'Cloud storage is not available'
          );
        }
        return this.cloudStorage;
        
      default:
        throw new StorageError(
          StorageErrorCode.UNKNOWN_ERROR,
          `Unknown storage layer: ${layer}`
        );
    }
  }

  /**
   * Add an event listener
   * @param event Event to listen for
   * @param listener Function to call when event occurs
   * @returns Function to remove the listener
   */
  addEventListener(event: StorageEvent, listener: StorageEventListener): () => void {
    // Get or create set of listeners for this event
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    const listeners = this.eventListeners.get(event)!;
    listeners.add(listener);
    
    // Return a function to remove the listener
    return () => {
      if (this.eventListeners.has(event)) {
        const listeners = this.eventListeners.get(event)!;
        listeners.delete(listener);
      }
    };
  }

  /**
   * Emit an event to listeners
   * @param event Event to emit
   * @param key Key related to the event (optional)
   */
  private emitEvent(event: StorageEvent, key?: string): void {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    const listeners = this.eventListeners.get(event)!;
    for (const listener of listeners) {
      try {
        listener(event, key);
      } catch (error) {
        console.error('Error in storage event listener:', error);
      }
    }
  }
}