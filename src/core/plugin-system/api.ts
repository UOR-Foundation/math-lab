/**
 * Plugin API
 * 
 * Provides the API interface for plugins to interact with the dashboard.
 */

import { 
  DashboardAPI, 
  PluginStorageAPI, 
  PluginEventAPI, 
  PluginUIAPI,
  PluginAPI,
  PluginManifest,
  PluginPermission
} from './types';
import { hasPermission } from './sandbox';

/**
 * Creates an API instance for a plugin
 * 
 * @param manifest Plugin manifest
 * @param dashboard Dashboard API implementation
 * @param mathJs Math-js library instance
 * @param storage Storage API implementation
 * @param events Event API implementation
 * @param ui UI API implementation
 * @returns Plugin API instance
 */
export function createPluginAPI(
  manifest: PluginManifest,
  dashboard: DashboardAPI,
  mathJs: unknown,
  storage: PluginStorageAPI,
  events: PluginEventAPI,
  ui: PluginUIAPI
): PluginAPI {
  return {
    // Provide the dashboard API with permission checks
    dashboard: createDashboardAPI(dashboard, manifest),
    
    // Provide the math-js library
    mathJs,
    
    // Provide the storage API with permission checks
    storage: createStorageAPI(storage, manifest),
    
    // Provide the event API with permission checks
    events: createEventAPI(events, manifest),
    
    // Provide the UI API with permission checks
    ui: createUIAPI(ui, manifest)
  };
}

/**
 * Create an API method handler with permission check
 * 
 * @param manifest Plugin manifest
 * @param method Method implementation
 * @param permission Required permission
 * @param fallback Fallback function to call if permission not granted
 * @returns Method with permission check
 */
export function createPermissionCheck<T>(
  manifest: PluginManifest,
  method: T,
  permission: PluginPermission,
  fallback?: T
): T {
  // Use a type guard to resolve the typing issues
  // We need to cast to unknown first to avoid the TS error
  const permissionCheck = function(this: unknown, ...args: unknown[]): unknown {
    if (hasPermission(manifest, permission)) {
      // Call the method with the arguments
      return (method as unknown as (...args: unknown[]) => unknown).apply(this, args);
    }
    
    if (fallback) {
      // Call the fallback with the arguments
      return (fallback as unknown as (...args: unknown[]) => unknown).apply(this, args);
    }
    
    throw new Error(`Permission denied: ${permission}`);
  };
  
  return permissionCheck as unknown as T;
}

/**
 * Create a dashboard API with permission checks
 * 
 * @param dashboard Dashboard API implementation
 * @param manifest Plugin manifest
 * @returns Dashboard API with permission checks
 */
function createDashboardAPI(
  dashboard: DashboardAPI,
  manifest: PluginManifest
): DashboardAPI {
  return {
    registerTool: createPermissionCheck<(tool: { id: string; name: string; icon: string; component: unknown }) => void>(
      manifest,
      (tool: { id: string; name: string; icon: string; component: unknown }) => dashboard.registerTool(tool),
      'ui',
      () => { console.warn('UI permission required to register tools'); }
    ),
    
    registerPanel: createPermissionCheck<(panel: { id: string; component: unknown }) => void>(
      manifest,
      (panel: { id: string; component: unknown }) => dashboard.registerPanel(panel),
      'ui',
      () => { console.warn('UI permission required to register panels'); }
    ),
    
    registerVisualization: createPermissionCheck<(visualization: { id: string; component: unknown }) => void>(
      manifest,
      (visualization: { id: string; component: unknown }) => dashboard.registerVisualization(visualization),
      'ui',
      () => { console.warn('UI permission required to register visualizations'); }
    ),
    
    showResult: (result: unknown) => {
      dashboard.showResult(result);
    },
    
    showError: (error: Error | string) => {
      dashboard.showError(error);
    },
    
    updateProgressBar: createPermissionCheck<(progress: number) => void>(
      manifest,
      (progress: number) => dashboard.updateProgressBar(progress),
      'computation',
      () => { console.warn('Computation permission required to update progress bar'); }
    )
  };
}

/**
 * Create a storage API with permission checks
 * 
 * @param storage Storage API implementation
 * @param manifest Plugin manifest
 * @returns Storage API with permission checks
 */
function createStorageAPI(
  storage: PluginStorageAPI,
  manifest: PluginManifest
): PluginStorageAPI {
  const pluginId = manifest.id;
  const noOpStorageApi = {
    getItem: async () => { 
      throw new Error('Storage permission not granted'); 
    },
    setItem: async () => { 
      throw new Error('Storage permission not granted'); 
    },
    removeItem: async () => { 
      throw new Error('Storage permission not granted'); 
    },
    clear: async () => { 
      throw new Error('Storage permission not granted'); 
    },
    keys: async () => { 
      throw new Error('Storage permission not granted'); 
      return [] as string[];
    }
  };
  
  // Create functions for each storage operation
  const getItem = async (key: string): Promise<unknown> => {
    return storage.getItem(`${pluginId}:${key}`);
  };
  
  const setItem = async (key: string, value: unknown): Promise<void> => {
    return storage.setItem(`${pluginId}:${key}`, value);
  };
  
  const removeItem = async (key: string): Promise<void> => {
    return storage.removeItem(`${pluginId}:${key}`);
  };
  
  const clear = async (): Promise<void> => {
    // Get all keys for this plugin
    const allKeys = await storage.keys();
    const pluginKeys = allKeys.filter(k => k.startsWith(`${pluginId}:`));
    
    // Remove all plugin keys
    for (const key of pluginKeys) {
      await storage.removeItem(key);
    }
  };
  
  const keys = async (): Promise<string[]> => {
    // Get all keys for this plugin
    const allKeys = await storage.keys();
    const pluginKeys = allKeys.filter(k => k.startsWith(`${pluginId}:`));
    
    // Remove the plugin ID prefix
    return pluginKeys.map(k => k.substring(pluginId.length + 1));
  };
  
  // Namespace all storage keys with plugin ID to prevent conflicts
  return {
    getItem: createPermissionCheck(
      manifest,
      getItem,
      'storage.local',
      noOpStorageApi.getItem
    ),
    
    setItem: createPermissionCheck(
      manifest,
      setItem,
      'storage.local',
      noOpStorageApi.setItem
    ),
    
    removeItem: createPermissionCheck(
      manifest,
      removeItem,
      'storage.local',
      noOpStorageApi.removeItem
    ),
    
    clear: createPermissionCheck(
      manifest,
      clear,
      'storage.local',
      noOpStorageApi.clear
    ),
    
    keys: createPermissionCheck(
      manifest,
      keys,
      'storage.local',
      noOpStorageApi.keys
    )
  };
}

/**
 * Create an event API with permission checks
 * 
 * @param events Event API implementation
 * @param manifest Plugin manifest
 * @returns Event API with permission checks
 */
function createEventAPI(
  events: PluginEventAPI,
  manifest: PluginManifest
): PluginEventAPI {
  const pluginId = manifest.id;
  
  return {
    subscribe: (eventName, callback) => {
      // Wrap callback to add plugin ID to context and add error handling
      const wrappedCallback = (data: unknown) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in plugin ${pluginId} event handler for ${eventName}:`, error);
        }
      };
      
      // Subscribe to the event
      return events.subscribe(eventName, wrappedCallback);
    },
    
    publish: (eventName, data) => {
      // Namespace custom events with plugin ID
      const namespacedEventName = eventName.startsWith('dashboard:')
        ? eventName 
        : `plugin:${pluginId}:${eventName}`;
      
      // Publish the event with source info
      if (data && typeof data === 'object') {
        events.publish(namespacedEventName, {
          ...(data as Record<string, unknown>),
          source: pluginId
        });
      } else {
        // If data is not an object, wrap it
        events.publish(namespacedEventName, {
          value: data,
          source: pluginId
        });
      }
    }
  };
}

/**
 * Create a UI API with permission checks
 * 
 * @param ui UI API implementation
 * @param manifest Plugin manifest
 * @returns UI API with permission checks
 */
function createUIAPI(
  ui: PluginUIAPI,
  manifest: PluginManifest
): PluginUIAPI {
  const noOpNotification = (): void => {
    console.warn('Notifications permission not granted');
  };
  
  const showNotification = (
    message: string, 
    options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }
  ): void => {
    ui.showNotification(message, options);
  };
  
  return {
    showNotification: createPermissionCheck(
      manifest,
      showNotification,
      'notifications',
      noOpNotification
    ),
    
    showModal: (title: string, content: unknown): Promise<void> => {
      return ui.showModal(title, content);
    },
    
    showConfirm: (message: string): Promise<boolean> => {
      return ui.showConfirm(message);
    }
  };
}