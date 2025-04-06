/**
 * Plugin Sandbox
 * 
 * Creates a secure sandbox environment for running plugin code.
 */

import { PluginManifest, PluginInstance, PluginPermission, DashboardAPI } from './types';

// Type definitions for our internal worker management
type MethodFunction = (...args: unknown[]) => unknown;
type EventFunction = (event: unknown) => void;
type ResolverFunction = (value: unknown) => void;
type RejecterFunction = (reason?: unknown) => void;

// Map to track active worker instances for each plugin
const workerInstances = new Map<string, {
  worker: Worker;
  methods: Map<string, MethodFunction>;
  events: Map<string, EventFunction>;
  resolvers: Map<string, { resolve: ResolverFunction; reject: RejecterFunction }>;
}>();

/**
 * Permission levels for different plugin operations
 * Higher number means more restricted permission
 * NOTE: Currently not used, but kept for future implementation
 */
// const PERMISSION_LEVELS: Record<PluginPermission, number> = {
//   'storage': 1,
//   'storage.local': 1,
//   'storage.cloud': 2,
//   'computation': 1,
//   'computation.intensive': 2,
//   'network': 2,
//   'clipboard': 2,
//   'notifications': 1,
//   'ui': 1
// };

/**
 * Create a sandboxed plugin instance
 * 
 * @param manifest Plugin manifest
 * @param code Plugin code to execute in the sandbox
 * @returns Plugin instance
 */
export function createSandbox(manifest: PluginManifest, code: string): PluginInstance {
  try {
    // Create a new worker for this plugin
    const worker = new Worker(new URL('../../../src/workers/plugin-sandbox-worker.ts', import.meta.url), {
      type: 'module'
    });
    
    // Plugin instance to return
    const instance: PluginInstance = {
      initialize: async (dashboard, mathJs, config) => {
        return initializePlugin(manifest.id, dashboard, mathJs, config);
      },
      cleanup: async () => {
        return cleanupPlugin(manifest.id);
      }
    };
    
    // Track worker and communication state
    workerInstances.set(manifest.id, {
      worker,
      methods: new Map(),
      events: new Map(),
      resolvers: new Map()
    });
    
    // Set up message handling
    setupWorkerMessageHandling(worker, manifest.id);
    
    // Load the plugin code in the worker
    worker.postMessage({
      type: 'load',
      id: manifest.id,
      payload: {
        manifest,
        code
      }
    });
    
    // Wait for the worker to load the plugin
    return wrapPluginInstance(instance, manifest);
  } catch (error) {
    throw new Error(`Error creating sandbox for plugin ${manifest.id}: ${String(error)}`);
  }
}

/**
 * Set up message handling for a worker
 */
function setupWorkerMessageHandling(worker: Worker, pluginId: string): void {
  worker.addEventListener('message', (event) => {
    const { type, id, payload } = event.data;
    const instance = workerInstances.get(pluginId);
    
    if (!instance) {
      console.error(`Received message for unknown plugin: ${pluginId}`);
      return;
    }
    
    switch (type) {
      case 'ready':
        // Worker is ready, nothing to do
        break;
        
      case 'loaded':
        // Plugin code loaded, nothing to do yet
        break;
        
      case 'initialized':
        // Plugin has been initialized
        resolvePromise(instance, 'initialize', id, payload);
        break;
        
      case 'cleaned-up':
        // Plugin has been cleaned up
        resolvePromise(instance, 'cleanup', id, payload);
        
        // Terminate the worker
        worker.terminate();
        workerInstances.delete(pluginId);
        break;
        
      case 'method-result':
        // Method call has returned a result
        resolvePromise(instance, payload.method, id, payload.result);
        break;
        
      case 'error': {
        // An error occurred in the worker
        const error = new Error(payload.message);
        if (payload.stack) {
          error.stack = payload.stack;
        }
        
        // Resolve the appropriate promise with error
        rejectPromise(instance, payload.method || payload.phase || 'unknown', id, error);
        break;
      }
        
      case 'api-call':
        // Plugin is calling an API method
        handleApiCall(instance, pluginId, payload, id);
        break;
        
      default:
        console.warn(`Unknown message type from plugin worker: ${type}`);
    }
  });
  
  worker.addEventListener('error', (event) => {
    console.error(`Worker error in plugin ${pluginId}:`, event);
    
    // Get all pending promises and reject them
    const instance = workerInstances.get(pluginId);
    if (instance) {
      for (const [id, { reject }] of instance.resolvers.entries()) {
        reject(new Error(`Worker error: ${event.message}`));
        instance.resolvers.delete(id);
      }
    }
  });
}

/**
 * Initialize a plugin in its worker
 */
async function initializePlugin(
  pluginId: string,
  dashboard: DashboardAPI,
  mathJs: unknown,
  config: unknown
): Promise<{ success: boolean; error?: string }> {
  const instance = workerInstances.get(pluginId);
  if (!instance) {
    throw new Error(`Plugin ${pluginId} not found`);
  }
  
  // Create a promise to track initialization
  const initId = `init-${Date.now()}`;
  const initPromise = createPromise<{ success: boolean; error?: string }>(instance, 'initialize', initId);
  
  // Send initialization message to worker
  instance.worker.postMessage({
    type: 'initialize',
    id: initId,
    payload: {
      dashboard: createApiInterface(dashboard),
      mathJs: createApiInterface(mathJs),
      config
    }
  });
  
  return initPromise;
}

/**
 * Clean up a plugin and terminate its worker
 */
async function cleanupPlugin(
  pluginId: string
): Promise<{ success: boolean; error?: string }> {
  const instance = workerInstances.get(pluginId);
  if (!instance) {
    return { success: true }; // Already cleaned up
  }
  
  // Create a promise to track cleanup
  const cleanupId = `cleanup-${Date.now()}`;
  const cleanupPromise = createPromise<{ success: boolean; error?: string }>(instance, 'cleanup', cleanupId);
  
  // Send cleanup message to worker
  instance.worker.postMessage({
    type: 'cleanup',
    id: cleanupId,
    payload: {}
  });
  
  return cleanupPromise;
}

/**
 * Create a promise and store its resolver functions
 */
function createPromise<T>(
  instance: {
    resolvers: Map<string, { resolve: ResolverFunction; reject: RejecterFunction }>;
  },
  _method: string, // Unused but kept for consistent API
  id: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    instance.resolvers.set(id, { 
      resolve: value => resolve(value as T), 
      reject 
    });
  });
}

/**
 * Resolve a promise by ID
 */
function resolvePromise(
  instance: {
    resolvers: Map<string, { resolve: ResolverFunction; reject: RejecterFunction }>;
  },
  _method: string, // Unused but kept for consistent API
  id: string,
  result: unknown
): void {
  const resolver = instance.resolvers.get(id);
  if (resolver) {
    resolver.resolve(result);
    instance.resolvers.delete(id);
  }
}

/**
 * Reject a promise by ID
 */
function rejectPromise(
  instance: {
    resolvers: Map<string, { resolve: ResolverFunction; reject: RejecterFunction }>;
  },
  _method: string, // Unused but kept for consistent API
  id: string,
  error: Error
): void {
  const resolver = instance.resolvers.get(id);
  if (resolver) {
    resolver.reject(error);
    instance.resolvers.delete(id);
  }
}

/**
 * Handle an API call from the plugin to the main thread
 */
async function handleApiCall(
  instance: {
    worker: Worker;
    resolvers: Map<string, { resolve: ResolverFunction; reject: RejecterFunction }>;
  },
  _pluginId: string, // Unused but kept for consistent API
  payload: { api: string; method: string; args: unknown[] },
  callId: string
): Promise<void> {
  const { api, method, args } = payload;
  
  try {
    // TODO: Implement permission checks here
    
    // Call the API method
    const result = await callApiMethod(api, method, args);
    
    // Send result back to worker
    instance.worker.postMessage({
      type: 'api-result',
      id: callId,
      payload: {
        result
      }
    });
  } catch (error) {
    // Send error back to worker
    instance.worker.postMessage({
      type: 'api-error',
      id: callId,
      payload: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
}

/**
 * Call an API method with proper error handling
 */
async function callApiMethod(api: string, method: string, _args: unknown[]): Promise<unknown> {
  // This is a simplified implementation
  // In a real application, we would have a proper API registry
  
  // TODO: Implement proper API method resolution
  throw new Error(`API method ${api}.${method} not implemented`);
}

/**
 * Create a simplified API interface to send to the worker
 */
function createApiInterface(api: unknown): Record<string, unknown> {
  if (!api || typeof api !== 'object') {
    return {};
  }
  
  const result: Record<string, unknown> = {};
  
  for (const key of Object.keys(api as object)) {
    const value = (api as Record<string, unknown>)[key];
    
    if (typeof value === 'function') {
      // For functions, just send a placeholder
      result[key] = true;
    } else if (typeof value === 'object' && value !== null) {
      // For nested objects, recurse
      result[key] = createApiInterface(value);
    } else {
      // For primitive values, send as-is
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Wrap plugin instance methods to add permission checks and other security measures
 * 
 * @param instance Original plugin instance
 * @param manifest Plugin manifest
 * @returns Wrapped plugin instance
 */
function wrapPluginInstance(
  instance: PluginInstance,
  manifest: PluginManifest
): PluginInstance {
  // We don't need to wrap initialize and cleanup since they are already implemented
  // to communicate with the worker
  
  // Prepare the wrapped instance
  const wrapped: PluginInstance = {
    initialize: instance.initialize,
    cleanup: instance.cleanup,
    
    // Add componentProxy getter to lazy-load components on first access
    get components() {
      return createComponentsProxy(manifest.id);
    },
    
    // Add methodsProxy getter to lazy-load methods on first access
    get methods() {
      return createMethodsProxy(manifest.id);
    },
    
    // Add eventsProxy getter to lazy-register event handlers
    get events() {
      return createEventsProxy(manifest.id);
    },
    
    // Add apiProxy getter to lazy-create API interface
    get api() {
      return createApiProxy(manifest.id);
    }
  };
  
  return wrapped;
}

/**
 * Create a proxy for plugin components
 */
function createComponentsProxy(_pluginId: string): Record<string, unknown> {
  const componentsProxy: Record<string, unknown> = {};
  
  // Add panels proxy
  componentsProxy.panels = {};
  
  // Add visualizations proxy
  componentsProxy.visualizations = {};
  
  // Add toolbarItems proxy
  componentsProxy.toolbarItems = {};
  
  return componentsProxy;
}

/**
 * Create a proxy for plugin methods
 */
function createMethodsProxy(pluginId: string): Record<string, MethodFunction> {
  const instance = workerInstances.get(pluginId);
  if (!instance) {
    throw new Error(`Plugin ${pluginId} not found`);
  }
  
  return new Proxy({} as Record<string, MethodFunction>, {
    get(_target: Record<string, MethodFunction>, property: string | symbol): unknown {
      if (typeof property !== 'string') {
        return undefined;
      }
      
      // If we already have a proxy for this method, return it
      if (instance.methods.has(property)) {
        return instance.methods.get(property);
      }
      
      // Create a proxy function for this method
      const methodProxy = async (...args: unknown[]): Promise<unknown> => {
        // Create a unique ID for this call
        const callId = `method-${property}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        
        // Create a promise to track the method call
        const methodPromise = createPromise<unknown>(instance, property, callId);
        
        // Send the method call to the worker
        instance.worker.postMessage({
          type: 'call-method',
          id: callId,
          payload: {
            method: property,
            args
          }
        });
        
        return methodPromise;
      };
      
      // Store the proxy for future use
      instance.methods.set(property, methodProxy);
      
      return methodProxy;
    }
  });
}

/**
 * Create a proxy for plugin event handlers
 */
function createEventsProxy(pluginId: string): Record<string, EventFunction> {
  const instance = workerInstances.get(pluginId);
  if (!instance) {
    throw new Error(`Plugin ${pluginId} not found`);
  }
  
  return new Proxy({} as Record<string, EventFunction>, {
    get(_target: Record<string, EventFunction>, property: string | symbol): unknown {
      if (typeof property !== 'string') {
        return undefined;
      }
      
      // If we already have a handler for this event, return it
      if (instance.events.has(property)) {
        return instance.events.get(property);
      }
      
      // Create an event handler function
      const eventHandler = (data: unknown): void => {
        // Send the event to the worker
        instance.worker.postMessage({
          type: 'event',
          id: `event-${property}-${Date.now()}`,
          payload: {
            event: property,
            data
          }
        });
        
        // Event handlers don't return anything
        return undefined;
      };
      
      // Store the handler for future use
      instance.events.set(property, eventHandler);
      
      return eventHandler;
    }
  });
}

/**
 * Create a proxy for the plugin's API
 */
function createApiProxy(_pluginId: string): Record<string, unknown> {
  // For now, we'll return an empty object
  // In a real implementation, we would expose the plugin's API methods
  return {};
}

/**
 * Check if a plugin has permission for an operation
 * 
 * @param manifest Plugin manifest
 * @param permission Required permission
 * @returns True if permission is granted
 */
export function hasPermission(manifest: PluginManifest, permission: PluginPermission): boolean {
  if (!manifest.permissions) {
    return false;
  }
  
  // Check for exact permission
  if (manifest.permissions.includes(permission)) {
    return true;
  }
  
  // Special case: computation.intensive requires explicit permission
  if (permission === 'computation.intensive') {
    return false; // Only grant if explicitly included above
  }
  
  // For other permissions with periods, check if the parent permission is granted
  // Parent permissions (e.g., 'storage' grants 'storage.local')
  if (permission.includes('.')) {
    const parentPermission = permission.split('.')[0] as PluginPermission;
    return manifest.permissions.includes(parentPermission);
  }
  
  // No permission match found
  return false;
}

/**
 * Get resource limits for a plugin based on manifest
 * 
 * @param manifest Plugin manifest
 * @returns Resource limits
 */
export function getResourceLimits(manifest: PluginManifest): {
  cpuLimit: number;
  memoryLimit: number;
} {
  const resources = manifest.resources || {};
  
  // Default limits
  const limits = {
    cpuLimit: 100, // Default CPU limit in ms per operation
    memoryLimit: 10 * 1024 * 1024 // Default memory limit (10MB)
  };
  
  // Adjust limits based on manifest
  if (resources.cpu === 'low') {
    limits.cpuLimit = 50;
  } else if (resources.cpu === 'high') {
    limits.cpuLimit = 500;
  }
  
  if (resources.memory === 'low') {
    limits.memoryLimit = 5 * 1024 * 1024; // 5MB
  } else if (resources.memory === 'high') {
    limits.memoryLimit = 50 * 1024 * 1024; // 50MB
  }
  
  return limits;
}