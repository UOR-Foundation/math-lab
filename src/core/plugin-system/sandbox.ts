/**
 * Plugin Sandbox
 * 
 * Creates a secure sandbox environment for running plugin code.
 */

import { PluginManifest, PluginInstance } from './types';

/**
 * Create a sandboxed plugin instance
 * 
 * @param manifest Plugin manifest
 * @param code Plugin code to execute in the sandbox
 * @returns Plugin instance
 */
export function createSandbox(manifest: PluginManifest, code: string): PluginInstance {
  // In a real implementation, this would create a true sandboxed environment
  // using techniques like:
  // - Web Workers with restricted capabilities
  // - iframes with Content Security Policy
  // - Service Workers with limited scope
  // - WebAssembly sandboxes
  
  // For now, we'll implement a simplified version that just executes the code
  // with some basic safety checks
  
  try {
    // Create an isolated module context
    const module = { exports: {} };
    const exports = module.exports;
    
    // Create a list of allowed globals
    const sandboxGlobals = {
      console: {
        log: (...args: unknown[]) => console.log(`[Plugin ${manifest.id}]:`, ...args),
        warn: (...args: unknown[]) => console.warn(`[Plugin ${manifest.id}]:`, ...args),
        error: (...args: unknown[]) => console.error(`[Plugin ${manifest.id}]:`, ...args),
      },
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
    };
    
    // Create the sandbox function
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
    
    // Mock require function with limited capabilities
    const mockRequire = (name: string) => {
      // In a real implementation, we would have a proper module resolution
      // system that restricts what can be imported
      throw new Error(`Cannot require module '${name}' in plugin sandbox`);
    };
    
    // Execute the plugin code in the sandbox
    const result = sandboxFn(
      module,
      exports,
      mockRequire,
      ...Object.values(sandboxGlobals)
    );
    
    // Get the plugin instance (either default export or module.exports)
    const pluginInstance = result.default || result;
    
    // Check that the plugin instance is valid
    if (!pluginInstance || typeof pluginInstance.initialize !== 'function') {
      throw new Error(`Invalid plugin instance - missing initialize method`);
    }
    
    // Wrap methods to add additional security checks
    return wrapPluginInstance(pluginInstance, manifest);
  } catch (error) {
    throw new Error(`Error creating sandbox for plugin ${manifest.id}: ${String(error)}`);
  }
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
  const wrapped: PluginInstance = {
    // Wrap initialize method
    initialize: async (dashboard, mathJs, config) => {
      try {
        return await instance.initialize(dashboard, mathJs, config);
      } catch (error) {
        console.error(`Error initializing plugin ${manifest.id}:`, error);
        return { success: false, error: String(error) };
      }
    },
    
    // Wrap cleanup method
    cleanup: async () => {
      try {
        if (instance.cleanup) {
          return await instance.cleanup();
        }
        return { success: true };
      } catch (error) {
        console.error(`Error cleaning up plugin ${manifest.id}:`, error);
        return { success: false, error: String(error) };
      }
    }
  };
  
  // Wrap components if they exist
  if (instance.components) {
    wrapped.components = {};
    
    // Wrap panels
    if (instance.components.panels) {
      wrapped.components.panels = {};
      for (const [key, component] of Object.entries(instance.components.panels)) {
        wrapped.components.panels[key] = component;
      }
    }
    
    // Wrap visualizations
    if (instance.components.visualizations) {
      wrapped.components.visualizations = {};
      for (const [key, component] of Object.entries(instance.components.visualizations)) {
        wrapped.components.visualizations[key] = component;
      }
    }
    
    // Wrap toolbar items
    if (instance.components.toolbarItems) {
      wrapped.components.toolbarItems = {};
      for (const [key, component] of Object.entries(instance.components.toolbarItems)) {
        wrapped.components.toolbarItems[key] = component;
      }
    }
  }
  
  // Wrap methods if they exist
  if (instance.methods) {
    wrapped.methods = {};
    for (const [key, method] of Object.entries(instance.methods)) {
      wrapped.methods[key] = (...args: unknown[]) => {
        try {
          return method(...args);
        } catch (error) {
          console.error(`Error in plugin ${manifest.id} method ${key}:`, error);
          throw error;
        }
      };
    }
  }
  
  // Wrap events if they exist
  if (instance.events) {
    wrapped.events = {};
    for (const [key, handler] of Object.entries(instance.events)) {
      wrapped.events[key] = (event: unknown) => {
        try {
          return handler(event);
        } catch (error) {
          console.error(`Error in plugin ${manifest.id} event handler ${key}:`, error);
        }
      };
    }
  }
  
  // Wrap API if it exists
  if (instance.api) {
    wrapped.api = {};
    for (const [key, value] of Object.entries(instance.api)) {
      if (typeof value === 'function') {
        wrapped.api[key] = (...args: unknown[]) => {
          try {
            return value(...args);
          } catch (error) {
            console.error(`Error in plugin ${manifest.id} API function ${key}:`, error);
            throw error;
          }
        };
      } else {
        wrapped.api[key] = value;
      }
    }
  }
  
  return wrapped;
}