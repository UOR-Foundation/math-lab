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
  // Get plugin permissions
  const permissions = manifest.permissions || [];
  
  return {
    // Provide the dashboard API with permission checks
    dashboard: createDashboardAPI(dashboard, permissions),
    
    // Provide the math-js library
    mathJs,
    
    // Provide the storage API with permission checks
    storage: createStorageAPI(storage, manifest.id, permissions),
    
    // Provide the event API with permission checks
    events: createEventAPI(events, manifest.id, permissions),
    
    // Provide the UI API with permission checks
    ui: createUIAPI(ui, permissions)
  };
}

/**
 * Create a dashboard API with permission checks
 * 
 * @param dashboard Dashboard API implementation
 * @param permissions Plugin permissions
 * @returns Dashboard API with permission checks
 */
function createDashboardAPI(
  dashboard: DashboardAPI,
  _permissions: PluginPermission[]
): DashboardAPI {
  return {
    registerTool: (tool) => {
      dashboard.registerTool(tool);
    },
    registerPanel: (panel) => {
      dashboard.registerPanel(panel);
    },
    registerVisualization: (visualization) => {
      // Check for visualization permission
      dashboard.registerVisualization(visualization);
    },
    showResult: (result) => {
      dashboard.showResult(result);
    },
    showError: (error) => {
      dashboard.showError(error);
    },
    updateProgressBar: (progress) => {
      dashboard.updateProgressBar(progress);
    }
  };
}

/**
 * Create a storage API with permission checks
 * 
 * @param storage Storage API implementation
 * @param pluginId Plugin ID
 * @param permissions Plugin permissions
 * @returns Storage API with permission checks
 */
function createStorageAPI(
  storage: PluginStorageAPI,
  pluginId: string,
  _permissions: PluginPermission[]
): PluginStorageAPI {
  // Check if plugin has storage permission
  const hasStoragePermission = _permissions.some((p: PluginPermission) => 
    p === 'storage' || p === 'storage.local' || p === 'storage.cloud'
  );
  
  if (!hasStoragePermission) {
    // Return no-op storage API
    return {
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
      }
    };
  }
  
  // Namespace all storage keys with plugin ID to prevent conflicts
  return {
    getItem: async (key) => {
      return storage.getItem(`${pluginId}:${key}`);
    },
    setItem: async (key, value) => {
      return storage.setItem(`${pluginId}:${key}`, value);
    },
    removeItem: async (key) => {
      return storage.removeItem(`${pluginId}:${key}`);
    },
    clear: async () => {
      // Get all keys for this plugin
      const allKeys = await storage.keys();
      const pluginKeys = allKeys.filter(k => k.startsWith(`${pluginId}:`));
      
      // Remove all plugin keys
      for (const key of pluginKeys) {
        await storage.removeItem(key);
      }
    },
    keys: async () => {
      // Get all keys for this plugin
      const allKeys = await storage.keys();
      const pluginKeys = allKeys.filter(k => k.startsWith(`${pluginId}:`));
      
      // Remove the plugin ID prefix
      return pluginKeys.map(k => k.substring(pluginId.length + 1));
    }
  };
}

/**
 * Create an event API with permission checks
 * 
 * @param events Event API implementation
 * @param pluginId Plugin ID
 * @param permissions Plugin permissions
 * @returns Event API with permission checks
 */
function createEventAPI(
  events: PluginEventAPI,
  pluginId: string,
  _permissions: PluginPermission[]
): PluginEventAPI {
  return {
    subscribe: (eventName, callback) => {
      // Wrap callback to add plugin ID to context
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
 * @param permissions Plugin permissions
 * @returns UI API with permission checks
 */
function createUIAPI(
  ui: PluginUIAPI,
  _permissions: PluginPermission[]
): PluginUIAPI {
  // Check if plugin has notifications permission
  const hasNotificationsPermission = _permissions.includes('notifications');
  
  return {
    showNotification: (message, options) => {
      if (!hasNotificationsPermission) {
        console.warn('Notification permission not granted');
        return;
      }
      ui.showNotification(message, options);
    },
    showModal: (title, content) => {
      return ui.showModal(title, content);
    },
    showConfirm: (message) => {
      return ui.showConfirm(message);
    }
  };
}