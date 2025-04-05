/**
 * Storage API Implementation
 * 
 * Provides the concrete implementation of the PluginStorageAPI interface
 * for use with the plugin system.
 */

import { PluginStorageAPI } from '../types';
import { storageManager, StorageLayer } from '../../storage';

/**
 * Creates a storage API implementation that uses the storage manager
 * to persist plugin data.
 * 
 * @param namespace Namespace prefix for all keys
 * @returns Storage API implementation
 */
export function createStorageApiImpl(namespace: string = 'plugins'): PluginStorageAPI {
  return {
    getItem: async (key: string) => {
      return storageManager.get(`${namespace}:${key}`, StorageLayer.LOCAL);
    },

    setItem: async (key: string, value: unknown) => {
      await storageManager.set(`${namespace}:${key}`, value, StorageLayer.LOCAL);
    },

    removeItem: async (key: string) => {
      await storageManager.remove(`${namespace}:${key}`, StorageLayer.LOCAL);
    },

    clear: async () => {
      const keys = await storageManager.keys(StorageLayer.LOCAL);
      const pluginKeys = keys.filter(k => k.startsWith(`${namespace}:`));
      
      for (const key of pluginKeys) {
        await storageManager.remove(key, StorageLayer.LOCAL);
      }
    },

    keys: async () => {
      const keys = await storageManager.keys(StorageLayer.LOCAL);
      return keys
        .filter(k => k.startsWith(`${namespace}:`))
        .map(k => k.substring(namespace.length + 1));
    }
  };
}
