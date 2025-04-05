/**
 * Plugin Loader
 * 
 * Handles loading plugins from various sources.
 */

import { PluginManifest, PluginInstance, PluginLoaderOptions, PluginStatus } from './types';
import { pluginRegistry } from './registry';
import { createSandbox } from './sandbox';
import { validateManifest } from './validator';

/**
 * Load a plugin from a URL or source string
 * 
 * @param id Plugin ID or URL
 * @param options Loader options
 * @returns Promise resolving to the loaded plugin instance
 */
export async function loadPlugin(
  id: string,
  options: PluginLoaderOptions = {}
): Promise<PluginInstance> {
  try {
    // Step 1: Load the plugin manifest
    const manifest = await loadManifest(id, options);
    
    // Step 2: Validate the manifest
    validateManifest(manifest);
    
    // Step 3: Register the plugin with the registry if not already registered
    if (!pluginRegistry.hasPlugin(manifest.id)) {
      pluginRegistry.register(manifest);
    }
    
    // Step 4: Check if dependencies are satisfied
    if (!pluginRegistry.areDependenciesSatisfied(manifest.id)) {
      throw new Error(`Dependencies not satisfied for plugin ${manifest.id}`);
    }
    
    // Step 5: Load the plugin code
    const pluginCode = await loadPluginCode(manifest, options);
    
    // Step 6: Create plugin instance
    const instance = createPluginInstance(manifest, pluginCode, options);
    
    // Step 7: Update registry with loaded plugin
    pluginRegistry.updatePlugin(manifest.id, instance, 'loaded');
    
    return instance;
  } catch (error) {
    if (error instanceof Error) {
      // Update registry with error status if the plugin was registered
      if (id && pluginRegistry.hasPlugin(id)) {
        pluginRegistry.setPluginError(id, error);
      }
      throw error;
    }
    throw new Error(`Unknown error loading plugin: ${String(error)}`);
  }
}

/**
 * Initialize a loaded plugin
 * 
 * @param id Plugin ID
 * @param dashboard Dashboard API to provide to the plugin
 * @param mathJs Math-js library instance to provide to the plugin
 * @returns Promise resolving when the plugin is initialized
 */
export async function initializePlugin(
  id: string,
  dashboard: any,
  mathJs: any
): Promise<void> {
  const plugin = pluginRegistry.getPlugin(id);
  if (!plugin) {
    throw new Error(`Plugin ${id} is not registered`);
  }
  
  if (!plugin.instance) {
    throw new Error(`Plugin ${id} is not loaded`);
  }
  
  try {
    // Get plugin config from manifest
    const config = plugin.manifest.config || {};
    
    // Initialize the plugin
    const result = await plugin.instance.initialize(dashboard, mathJs, config);
    
    if (!result.success) {
      throw new Error(result.error || `Failed to initialize plugin ${id}`);
    }
    
    // Mark as initialized in registry
    pluginRegistry.updatePlugin(id, plugin.instance, 'initialized');
    
    // Enable the plugin
    pluginRegistry.enablePlugin(id);
  } catch (error) {
    if (error instanceof Error) {
      pluginRegistry.setPluginError(id, error);
      throw error;
    }
    throw new Error(`Unknown error initializing plugin: ${String(error)}`);
  }
}

/**
 * Unload a plugin
 * 
 * @param id Plugin ID
 * @returns Promise resolving when the plugin is unloaded
 */
export async function unloadPlugin(id: string): Promise<void> {
  const plugin = pluginRegistry.getPlugin(id);
  if (!plugin) {
    throw new Error(`Plugin ${id} is not registered`);
  }
  
  // Skip if plugin is not loaded
  if (!plugin.instance) {
    return;
  }
  
  try {
    // Call cleanup method if it exists
    if (plugin.instance.cleanup) {
      const result = await plugin.instance.cleanup();
      if (!result.success) {
        throw new Error(result.error || `Failed to clean up plugin ${id}`);
      }
    }
    
    // Unregister the plugin
    pluginRegistry.unregisterPlugin(id);
  } catch (error) {
    if (error instanceof Error) {
      pluginRegistry.setPluginError(id, error);
      throw error;
    }
    throw new Error(`Unknown error unloading plugin: ${String(error)}`);
  }
}

/**
 * Load a plugin manifest from a URL or ID
 * 
 * @param id Plugin ID or URL
 * @param options Loader options
 * @returns Promise resolving to the plugin manifest
 */
async function loadManifest(
  id: string,
  options: PluginLoaderOptions
): Promise<PluginManifest> {
  // If URL is provided directly, use it
  const url = options.url || id;
  
  // If manifest is loading from URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      // Construct the manifest URL
      const manifestUrl = url.endsWith('/manifest.json') 
        ? url 
        : `${url.endsWith('/') ? url : `${url}/`}manifest.json`;
      
      // Fetch the manifest
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch plugin manifest: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to load plugin manifest from URL: ${String(error)}`);
    }
  }
  
  // If source is provided directly
  if (options.source) {
    try {
      // Parse source as JSON
      return JSON.parse(options.source);
    } catch (error) {
      throw new Error(`Failed to parse plugin manifest from source: ${String(error)}`);
    }
  }
  
  // If it's a local plugin ID, load it from the registry or local storage
  // For now, we'll implement a placeholder that would need to be replaced
  // with actual loading logic in a real implementation
  throw new Error('Plugin manifest loading from local ID not implemented');
}

/**
 * Load plugin code from its entry point
 * 
 * @param manifest Plugin manifest
 * @param options Loader options
 * @returns Promise resolving to the plugin code
 */
async function loadPluginCode(
  manifest: PluginManifest,
  options: PluginLoaderOptions
): Promise<string> {
  // If source is provided directly
  if (options.source) {
    return options.source;
  }
  
  // If URL is provided
  const url = options.url || '';
  if (url) {
    try {
      // Resolve the entry point URL
      const entryPointUrl = url.endsWith('/')
        ? `${url}${manifest.entryPoint}`
        : `${url}/${manifest.entryPoint}`;
      
      // Fetch the plugin code
      const response = await fetch(entryPointUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch plugin code: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to load plugin code from URL: ${String(error)}`);
    }
  }
  
  // If it's a local plugin, load it from the file system or local storage
  // For now, we'll implement a placeholder that would need to be replaced
  // with actual loading logic in a real implementation
  throw new Error('Plugin code loading from local ID not implemented');
}

/**
 * Create a plugin instance from code
 * 
 * @param manifest Plugin manifest
 * @param code Plugin code
 * @param options Loader options
 * @returns Plugin instance
 */
function createPluginInstance(
  manifest: PluginManifest,
  code: string,
  options: PluginLoaderOptions
): PluginInstance {
  try {
    // If sandbox is enabled, execute in sandbox
    if (options.sandbox !== false) {
      return createSandbox(manifest, code);
    }
    
    // Otherwise, execute directly (unsafe for untrusted plugins)
    // This is a simplified implementation that would need to be replaced
    // with a safer approach in a real implementation
    const module = { exports: {} };
    const moduleFactory = new Function('module', 'exports', code);
    
    moduleFactory(module, module.exports);
    
    const pluginExports = module.exports;
    
    // Check for default export
    const pluginInstance = pluginExports.default || pluginExports;
    
    // Validate plugin instance
    if (!pluginInstance || typeof pluginInstance.initialize !== 'function') {
      throw new Error(`Invalid plugin instance - missing initialize method`);
    }
    
    return pluginInstance as PluginInstance;
  } catch (error) {
    throw new Error(`Failed to create plugin instance: ${String(error)}`);
  }
}