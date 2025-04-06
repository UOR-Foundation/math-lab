/**
 * Plugin Sandbox Worker
 * 
 * This worker provides a secure environment for executing plugin code.
 * It handles message passing between the main thread and the sandboxed plugin.
 */

interface PluginMessage {
  type: string;
  id: string;
  payload: Record<string, unknown>;
}

interface PluginEnvironment {
  id: string;
  manifest: Record<string, unknown>;
  exports: Record<string, unknown>;
  initialized: boolean;
}

// Store the plugin environment
let pluginEnv: PluginEnvironment | null = null;

// Restricted console access
const restrictedConsole = {
  log: (...args: unknown[]) => {
    const pluginId = pluginEnv?.id || 'unknown';
    console.log(`[Plugin ${pluginId}]:`, ...args);
    // We don't send console logs back to main thread to avoid flooding
  },
  warn: (...args: unknown[]) => {
    const pluginId = pluginEnv?.id || 'unknown';
    console.warn(`[Plugin ${pluginId}]:`, ...args);
  },
  error: (...args: unknown[]) => {
    const pluginId = pluginEnv?.id || 'unknown';
    console.error(`[Plugin ${pluginId}]:`, ...args);
  }
};

// List of allowed globals in the plugin sandbox
const allowedGlobals = {
  console: restrictedConsole,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Promise,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Date,
  Math,
  JSON,
  Error,
  Map,
  Set,
  WeakMap,
  WeakSet,
  Symbol,
  Uint8Array,
  Uint16Array,
  Uint32Array,
  Int8Array,
  Int16Array,
  Int32Array,
  Float32Array,
  Float64Array,
  ArrayBuffer,
  self: undefined // Will be overridden to prevent access to worker scope
};

// Helper function to get a string from unknown data
function getStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

// Helper function to ensure payload is correctly typed
function getLoadPayload(payload: unknown): { manifest: Record<string, unknown>; code: string } {
  if (typeof payload === 'object' && payload !== null) {
    const typedPayload = payload as Record<string, unknown>;
    // Extract manifest and code from payload
    const manifest = typedPayload.manifest as Record<string, unknown>;
    const code = getStringValue(typedPayload.code);
    
    return { manifest, code };
  }
  
  throw new Error('Invalid payload for load message');
}

// Helper function to extract method and args
function getMethodCallPayload(payload: unknown): { method: string; args: unknown[] } {
  if (typeof payload === 'object' && payload !== null) {
    const typedPayload = payload as Record<string, unknown>;
    const method = getStringValue(typedPayload.method);
    const args = Array.isArray(typedPayload.args) ? typedPayload.args : [];
    
    return { method, args };
  }
  
  throw new Error('Invalid payload for method call');
}

// Helper function to extract event and data
function getEventPayload(payload: unknown): { event: string; data: unknown } {
  if (typeof payload === 'object' && payload !== null) {
    const typedPayload = payload as Record<string, unknown>;
    const event = getStringValue(typedPayload.event);
    
    return { event, data: typedPayload.data };
  }
  
  throw new Error('Invalid payload for event');
}

// Communicate with the main thread
self.onmessage = async (event: MessageEvent<PluginMessage>) => {
  const { type, id, payload } = event.data;
  
  try {
    switch (type) {
      case 'load':
        await handleLoadPlugin(id, getLoadPayload(payload));
        break;
        
      case 'initialize':
        await handleInitializePlugin(payload);
        break;
        
      case 'cleanup':
        await handleCleanupPlugin();
        break;
        
      case 'call-method': {
        const { method, args } = getMethodCallPayload(payload);
        await handleCallMethod(method, args);
        break;
      }
        
      case 'event': {
        const { event, data } = getEventPayload(payload);
        await handleEvent(event, data);
        break;
      }
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: 'error',
      id,
      payload: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
};

/**
 * Load and evaluate plugin code
 */
async function handleLoadPlugin(id: string, { manifest, code }: { manifest: Record<string, unknown>; code: string }): Promise<void> {
  try {
    // Create module environment
    const module = { exports: {} };
    const exports = module.exports;
    
    // Create restricted require function
    const mockRequire = (name: string) => {
      throw new Error(`Cannot require module '${name}' in plugin sandbox`);
    };
    
    // Override self in allowed globals to prevent access to worker scope
    const sandboxGlobals = { ...allowedGlobals, self: undefined };
    
    // Create sandbox function with allowed globals
    const sandboxFn = new Function(
      'module',
      'exports',
      'require',
      ...Object.keys(sandboxGlobals),
      `
      "use strict";
      // Plugin code starts here
      ${code}
      // Plugin code ends here
      return module.exports;
      `
    );
    
    // Execute the plugin code in the sandbox
    const result = sandboxFn(
      module,
      exports,
      mockRequire,
      ...Object.values(sandboxGlobals)
    );
    
    // Get the plugin instance (either default export or module.exports)
    const pluginInstance = result.default || result;
    
    // Store the plugin environment
    pluginEnv = {
      id,
      manifest,
      exports: pluginInstance,
      initialized: false
    };
    
    // Validate plugin instance
    if (!pluginInstance || typeof pluginInstance.initialize !== 'function') {
      throw new Error(`Invalid plugin instance - missing initialize method`);
    }
    
    // Send success message
    self.postMessage({
      type: 'loaded',
      id,
      payload: {
        success: true
      }
    });
  } catch (error) {
    // Send error message
    self.postMessage({
      type: 'error',
      id,
      payload: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        phase: 'load'
      }
    });
  }
}

/**
 * Initialize the plugin with dashboard APIs
 */
async function handleInitializePlugin(apis: Record<string, unknown>): Promise<void> {
  if (!pluginEnv) {
    throw new Error('Plugin environment not initialized');
  }
  
  try {
    // Create proxy API objects to safely handle method calls
    const dashboard = createAPIProxy(apis.dashboard, 'dashboard');
    const mathJs = createAPIProxy(apis.mathJs, 'mathJs');
    const config = pluginEnv.manifest.config || {};
    
    // Get the initialize method from exports
    const pluginExports = pluginEnv.exports as Record<string, unknown>;
    
    if (typeof pluginExports.initialize !== 'function') {
      throw new Error('Plugin does not have an initialize method');
    }
    
    // Call the initialize method
    const initializeMethod = pluginExports.initialize as (
      dashboard: unknown,
      mathJs: unknown,
      config: unknown
    ) => Promise<unknown>;
    
    const result = await initializeMethod(dashboard, mathJs, config);
    
    // Mark as initialized
    pluginEnv.initialized = true;
    
    // Send result back to main thread
    self.postMessage({
      type: 'initialized',
      id: pluginEnv.id,
      payload: result
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: pluginEnv.id,
      payload: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        phase: 'initialize'
      }
    });
  }
}

/**
 * Handle plugin cleanup
 */
async function handleCleanupPlugin(): Promise<void> {
  if (!pluginEnv) {
    throw new Error('Plugin environment not initialized');
  }
  
  try {
    // Get the exports with proper type
    const exports = pluginEnv.exports as Record<string, unknown>;
    
    // Call the cleanup method if it exists
    if (typeof exports.cleanup === 'function') {
      const cleanupMethod = exports.cleanup as () => Promise<unknown>;
      const result = await cleanupMethod();
      
      // Send result back to main thread
      self.postMessage({
        type: 'cleaned-up',
        id: pluginEnv.id,
        payload: result
      });
    } else {
      // If no cleanup method, just return success
      self.postMessage({
        type: 'cleaned-up',
        id: pluginEnv.id,
        payload: { success: true }
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: pluginEnv.id,
      payload: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        phase: 'cleanup'
      }
    });
  }
}

/**
 * Call a plugin method
 */
async function handleCallMethod(method: string, args: unknown[]): Promise<void> {
  if (!pluginEnv) {
    throw new Error('Plugin environment not initialized');
  }
  
  if (!pluginEnv.initialized) {
    throw new Error('Plugin not initialized');
  }
  
  try {
    // Get the export object properly typed
    const exports = pluginEnv.exports as Record<string, unknown>;
    const methods = exports.methods as Record<string, unknown> | undefined;
    
    if (!methods) {
      throw new Error('Plugin has no methods defined');
    }
    
    // Get the method from the plugin
    const methodFn = methods[method];
    if (typeof methodFn !== 'function') {
      throw new Error(`Method ${method} not found in plugin or is not a function`);
    }
    
    // Call the method
    const result = await (methodFn as (...args: unknown[]) => Promise<unknown>)(...args);
    
    // Send result back to main thread
    self.postMessage({
      type: 'method-result',
      id: pluginEnv.id,
      payload: {
        method,
        result
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: pluginEnv.id,
      payload: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        phase: 'method',
        method
      }
    });
  }
}

/**
 * Handle an event for the plugin
 */
async function handleEvent(event: string, data: unknown): Promise<void> {
  if (!pluginEnv) {
    throw new Error('Plugin environment not initialized');
  }
  
  if (!pluginEnv.initialized) {
    throw new Error('Plugin not initialized');
  }
  
  try {
    // Get the export object properly typed
    const exports = pluginEnv.exports as Record<string, unknown>;
    const events = exports.events as Record<string, unknown> | undefined;
    
    if (!events) {
      // No events defined, silently ignore
      return;
    }
    
    // Get the event handler from the plugin
    const handler = events[event];
    if (typeof handler !== 'function') {
      // Silently ignore if handler doesn't exist or isn't a function
      return;
    }
    
    // Call the event handler
    await (handler as (data: unknown) => Promise<void>)(data);
    
    // No response needed for events
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: pluginEnv.id,
      payload: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        phase: 'event',
        event
      }
    });
  }
}

/**
 * Create a proxy for API objects to safely handle method calls
 */
function createAPIProxy(api: unknown, name: string): Record<string, unknown> {
  if (!api || typeof api !== 'object') {
    return {};
  }
  
  const proxy: Record<string, unknown> = {};
  const apiObj = api as Record<string, unknown>;
  
  for (const key of Object.keys(apiObj)) {
    const value = apiObj[key];
    
    if (typeof value === 'function') {
      // For API methods, create a proxy function that posts a message to the main thread
      proxy[key] = async (...args: unknown[]) => {
        // Generate a unique ID for this call
        const callId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        
        // Create a promise that will be resolved when the response is received
        return new Promise((resolve, reject) => {
          // Store the callbacks in a map
          const responseHandler = (event: MessageEvent) => {
            const { type, id, payload } = event.data as PluginMessage;
            
            if (id !== callId) {
              return; // Not our response
            }
            
            // Remove the event listener
            self.removeEventListener('message', responseHandler);
            
            if (type === 'api-result') {
              resolve((payload as Record<string, unknown>).result);
            } else if (type === 'api-error') {
              reject(new Error(String((payload as Record<string, unknown>).message)));
            }
          };
          
          // Add the event listener
          self.addEventListener('message', responseHandler);
          
          // Send the API call to the main thread
          self.postMessage({
            type: 'api-call',
            id: callId,
            payload: {
              api: name,
              method: key,
              args
            }
          });
        });
      };
    } else if (typeof value === 'object' && value !== null) {
      // For nested objects, create a nested proxy
      proxy[key] = createAPIProxy(value, `${name}.${key}`);
    } else {
      // For primitive values, just use the value
      proxy[key] = value;
    }
  }
  
  return proxy;
}

// Let the main thread know the worker is ready
self.postMessage({ type: 'ready', id: 'worker', payload: {} });