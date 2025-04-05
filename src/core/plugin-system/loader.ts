/**
 * Plugin Loader
 * 
 * Handles loading plugins from various sources.
 */

import {
  PluginManifest,
  PluginInstance,
  PluginLoaderOptions,
  DashboardAPI
} from './types';
import { pluginRegistry } from './registry';
import { createSandbox } from './sandbox';
import { validateManifest } from './validator';

// Plugin cache to reduce duplicate loading
const pluginCache: Map<string, {
  manifest: PluginManifest;
  code: string;
  timestamp: number;
}> = new Map();

// Default cache expiration time (1 hour in milliseconds)
const CACHE_EXPIRATION_TIME = 60 * 60 * 1000;

// Default plugin directory path
const DEFAULT_PLUGIN_DIRECTORY = './plugins';

/**
 * Load a plugin from a URL, local ID, or source string
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
    // Normalize the plugin ID
    const normalizedId = normalizePluginId(id);
    
    // Step 1: Check if the plugin is in cache and not expired
    const cached = getCachedPlugin(normalizedId, options);
    let manifest = cached?.manifest;
    let pluginCode = cached?.code;
    
    // If not in cache, load it
    if (!manifest || !pluginCode) {
      // Step 2: Load the plugin manifest
      manifest = await loadManifest(normalizedId, options);
      
      // Step 3: Validate the manifest
      validateManifest(manifest);
      
      // Step 4: Load the plugin code
      pluginCode = await loadPluginCode(manifest, options);
      
      // Step 5: Cache the plugin
      cachePlugin(normalizedId, manifest, pluginCode);
    }
    
    // Step 6: Register the plugin with the registry if not already registered
    if (!pluginRegistry.hasPlugin(manifest.id)) {
      pluginRegistry.register(manifest);
    }
    
    // Step 7: Check if dependencies are satisfied
    await ensureDependenciesSatisfied(manifest, options);
    
    // Step 8: Create plugin instance
    const instance = createPluginInstance(manifest, pluginCode, options);
    
    // Step 9: Update registry with loaded plugin
    pluginRegistry.updatePlugin(manifest.id, instance, 'loaded');
    
    return instance;
  } catch (error) {
    // Ensure detailed error reporting
    const errorMessage = formatErrorMessage(id, error);
    const wrappedError = new Error(errorMessage);
    
    // Update registry with error status if the plugin was registered
    if (id && pluginRegistry.hasPlugin(id)) {
      pluginRegistry.setPluginError(id, wrappedError);
    }
    
    // Rethrow the formatted error
    throw wrappedError;
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
  dashboard: DashboardAPI,
  mathJs: unknown
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
    const errorMessage = formatErrorMessage(id, error, 'initialization');
    const wrappedError = new Error(errorMessage);
    pluginRegistry.setPluginError(id, wrappedError);
    throw wrappedError;
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
    const errorMessage = formatErrorMessage(id, error, 'unloading');
    const wrappedError = new Error(errorMessage);
    pluginRegistry.setPluginError(id, wrappedError);
    throw wrappedError;
  }
}

/**
 * Clear the plugin cache
 * 
 * @param pluginId Optional plugin ID to clear specific cache entry
 */
export function clearPluginCache(pluginId?: string): void {
  if (pluginId) {
    pluginCache.delete(pluginId);
  } else {
    pluginCache.clear();
  }
}

/**
 * Get information about cached plugins
 * 
 * @returns Array of cache information
 */
export function getCacheInfo(): Array<{
  id: string;
  name: string;
  version: string;
  cachedAt: Date;
}> {
  return Array.from(pluginCache.entries()).map(([id, cache]) => ({
    id,
    name: cache.manifest.name,
    version: cache.manifest.version,
    cachedAt: new Date(cache.timestamp)
  }));
}

/**
 * Normalize a plugin ID for consistent caching
 * 
 * @param id Plugin ID or URL
 * @returns Normalized ID
 */
function normalizePluginId(id: string): string {
  // Convert URLs to a consistent format
  if (id.startsWith('http://') || id.startsWith('https://')) {
    const url = new URL(id);
    // Remove trailing slashes
    return url.toString().replace(/\/$/, '');
  }
  
  // Return local IDs as-is
  return id;
}

/**
 * Get a cached plugin if available and not expired
 * 
 * @param id Plugin ID
 * @param options Loader options
 * @returns Cached plugin or undefined
 */
function getCachedPlugin(
  id: string,
  options: PluginLoaderOptions
): { manifest: PluginManifest; code: string } | undefined {
  // Skip cache if explicitly disabled
  if (options.noCache) {
    return undefined;
  }
  
  const cached = pluginCache.get(id);
  if (!cached) {
    return undefined;
  }
  
  // Check if cache is expired
  const now = Date.now();
  const cacheExpiration = options.cacheExpiration || CACHE_EXPIRATION_TIME;
  
  if (now - cached.timestamp > cacheExpiration) {
    // Cache is expired, remove it
    pluginCache.delete(id);
    return undefined;
  }
  
  return {
    manifest: cached.manifest,
    code: cached.code
  };
}

/**
 * Cache a plugin for future use
 * 
 * @param id Plugin ID
 * @param manifest Plugin manifest
 * @param code Plugin code
 */
function cachePlugin(
  id: string,
  manifest: PluginManifest,
  code: string
): void {
  pluginCache.set(id, {
    manifest,
    code,
    timestamp: Date.now()
  });
}

/**
 * Ensure all dependencies for a plugin are satisfied
 * 
 * @param manifest Plugin manifest
 * @param options Loader options
 */
async function ensureDependenciesSatisfied(
  manifest: PluginManifest,
  options: PluginLoaderOptions
): Promise<void> {
  // If no dependencies, they're satisfied by default
  if (!manifest.dependencies || manifest.dependencies.length === 0) {
    return;
  }
  
  // Auto-load dependencies if not already loaded
  for (const dep of manifest.dependencies) {
    // Skip optional dependencies if not available
    if (dep.optional) {
      continue;
    }
    
    const isLoaded = pluginRegistry.hasPlugin(dep.id) && 
      pluginRegistry.getPlugin(dep.id)?.status !== 'error';
    
    // If dependency is not loaded, try to load it
    if (!isLoaded && options.loadDependencies !== false) {
      try {
        // Recursively load the dependency with a reference to its source
        const depOptions: PluginLoaderOptions = {
          ...options,
          url: options.pluginDirectory || DEFAULT_PLUGIN_DIRECTORY
        };
        
        await loadPlugin(dep.id, depOptions);
      } catch (error) {
        if (!dep.optional) {
          throw new Error(`Failed to load required dependency ${dep.id}: ${String(error)}`);
        }
        // Optional dependencies can fail without stopping the parent plugin
        console.warn(`Failed to load optional dependency ${dep.id}: ${String(error)}`);
      }
    }
  }
  
  // Final check to ensure all dependencies are satisfied
  if (!pluginRegistry.areDependenciesSatisfied(manifest.id)) {
    throw new Error(`Dependencies not satisfied for plugin ${manifest.id}`);
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
      // Parse source as JSON if it's a string
      if (typeof options.source === 'string') {
        return JSON.parse(options.source);
      }
      
      // If source is an object with manifest property, use that
      if (typeof options.source === 'object' && 'manifest' in options.source) {
        return options.source.manifest as PluginManifest;
      }
      
      // Otherwise, assume it's already a parsed manifest
      return options.source as PluginManifest;
    } catch (error) {
      throw new Error(`Failed to parse plugin manifest from source: ${String(error)}`);
    }
  }
  
  // If it's a local plugin ID, load it from the plugin directory
  try {
    const pluginDirectory = options.pluginDirectory || DEFAULT_PLUGIN_DIRECTORY;
    const manifestPath = `${pluginDirectory}/${id}/manifest.json`;
    
    // In a browser environment, we'll use fetch
    const response = await fetch(manifestPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch local plugin manifest: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to load plugin manifest from local ID: ${String(error)}`);
  }
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
    // If source is already code (string), return it
    if (typeof options.source === 'string') {
      return options.source;
    }
    
    // If source is an object with a code property, use it
    if (typeof options.source === 'object' && 'code' in options.source && typeof options.source.code === 'string') {
      return options.source.code;
    }
    
    throw new Error('Plugin code not found in source');
  }
  
  // If URL is provided or the ID is a URL
  const url = options.url || (manifest.id.startsWith('http') ? manifest.id : '');
  if (url) {
    try {
      // Resolve the entry point URL
      const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      const entryPointUrl = `${baseUrl}/${manifest.entryPoint}`;
      
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
  
  // If it's a local plugin, load it from the plugin directory
  try {
    const pluginDirectory = options.pluginDirectory || DEFAULT_PLUGIN_DIRECTORY;
    const codePath = `${pluginDirectory}/${manifest.id}/${manifest.entryPoint}`;
    
    // In a browser environment, we'll use fetch
    const response = await fetch(codePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch local plugin code: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to load plugin code from local ID: ${String(error)}`);
  }
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
    
    const pluginExports = module.exports as { default?: PluginInstance };
    
    // Check for default export
    const pluginInstance = pluginExports.default || pluginExports as unknown as PluginInstance;
    
    // Validate plugin instance
    if (!pluginInstance || typeof pluginInstance.initialize !== 'function') {
      throw new Error(`Invalid plugin instance - missing initialize method`);
    }
    
    return pluginInstance;
  } catch (error) {
    throw new Error(`Failed to create plugin instance: ${String(error)}`);
  }
}

/**
 * Format a detailed error message for plugin operations
 * 
 * @param pluginId Plugin ID
 * @param error The original error
 * @param stage Optional stage where the error occurred
 * @returns Formatted error message
 */
function formatErrorMessage(
  pluginId: string,
  error: unknown,
  stage?: string
): string {
  const errorMsg = error instanceof Error 
    ? error.message 
    : String(error);
  
  const stageMsg = stage 
    ? ` during ${stage}` 
    : '';
  
  return `Plugin error${stageMsg} [${pluginId}]: ${errorMsg}`;
}