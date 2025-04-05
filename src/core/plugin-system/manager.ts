/**
 * Plugin Manager
 * 
 * Manages the lifecycle of plugins within the dashboard.
 */

import { 
  PluginManifest, 
  PluginAPI,
  PluginManagerOptions,
  PluginLoaderOptions,
  DashboardAPI,
  PluginStorageAPI,
  PluginEventAPI,
  PluginUIAPI
} from './types';
import { pluginRegistry } from './registry';
import { loadPlugin, initializePlugin, unloadPlugin } from './loader';
import { createPluginAPI } from './api';
import { validateManifest } from './validator';
import { createPluginRepositoryConnector, PluginRepositoryConnector } from './repo-connector';

/**
 * Plugin Manager class for managing the lifecycle of plugins
 */
export class PluginManager {
  private options: PluginManagerOptions;
  private dashboard: DashboardAPI;
  private mathJs: unknown;
  private storage: PluginStorageAPI;
  private events: PluginEventAPI;
  private ui: PluginUIAPI;
  private pluginApis: Map<string, PluginAPI> = new Map();
  private repositoryConnector: PluginRepositoryConnector | null = null;
  
  /**
   * Create a new PluginManager
   * 
   * @param dashboard Dashboard API implementation
   * @param mathJs Math-js library instance
   * @param storage Storage API implementation
   * @param events Event API implementation
   * @param ui UI API implementation
   * @param options Plugin manager options
   */
  constructor(
    dashboard: DashboardAPI,
    mathJs: unknown,
    storage: PluginStorageAPI,
    events: PluginEventAPI,
    ui: PluginUIAPI,
    options: PluginManagerOptions = {}
  ) {
    this.dashboard = dashboard;
    this.mathJs = mathJs;
    this.storage = storage;
    this.events = events;
    this.ui = ui;
    this.options = {
      autoEnable: options.autoEnable !== false,
      pluginDirectory: options.pluginDirectory || './plugins',
      allowRemotePlugins: options.allowRemotePlugins === true,
      pluginRepository: options.pluginRepository || 'https://plugins.math-lab.uor-foundation.org'
    };
    
    // Initialize repository connector if repository is configured
    if (this.options.pluginRepository) {
      this.repositoryConnector = createPluginRepositoryConnector(this.options.pluginRepository);
    }
  }
  
  /**
   * Register a plugin with the manager
   * 
   * @param manifest Plugin manifest
   * @returns Promise resolving to the registered plugin ID
   */
  public async registerPlugin(manifest: PluginManifest): Promise<string> {
    try {
      // Validate the manifest
      validateManifest(manifest);
      
      // Register with the registry
      const entry = pluginRegistry.register(manifest);
      
      return entry.id;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error registering plugin: ${String(error)}`);
    }
  }
  
  /**
   * Load and initialize a plugin
   * 
   * @param id Plugin ID or URL
   * @param options Loader options
   * @returns Promise resolving when the plugin is loaded and initialized
   */
  public async loadPlugin(id: string, options?: PluginLoaderOptions): Promise<void> {
    try {
      // First check if the plugin is already registered
      const existingPlugin = pluginRegistry.getPlugin(id);
      
      if (existingPlugin && existingPlugin.status === 'initialized') {
        // Plugin is already loaded and initialized
        return;
      }
      
      // Load the plugin
      const instance = await loadPlugin(id, options);
      
      // Create plugin API
      const manifestToUse = existingPlugin?.manifest || 
        // TypeScript needs help here to understand the structure
        (instance as unknown as { manifest?: PluginManifest }).manifest || 
        { id, name: id, version: '0.0.0', author: { name: 'Unknown' }, license: 'Unknown', description: 'Unknown', entryPoint: '', compatibility: { mathJs: '*', dashboard: '*' } };
      
      const api = this.createApiForPlugin(manifestToUse);
      this.pluginApis.set(id, api);
      
      // Initialize the plugin
      await initializePlugin(id, api.dashboard, api.mathJs);
      
      // Enable the plugin if auto-enable is on
      if (this.options.autoEnable) {
        pluginRegistry.enablePlugin(id);
      }
      
      // Publish plugin loaded event
      this.events.publish('dashboard:plugin-loaded', { 
        pluginId: id,
        pluginName: existingPlugin?.manifest.name || ''
      });
    } catch (error) {
      this.events.publish('dashboard:plugin-error', {
        pluginId: id,
        error: String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Unload a plugin
   * 
   * @param id Plugin ID
   * @returns Promise resolving when the plugin is unloaded
   */
  public async unloadPlugin(id: string): Promise<void> {
    try {
      // Unload the plugin
      await unloadPlugin(id);
      
      // Remove from API cache
      this.pluginApis.delete(id);
      
      // Publish plugin unloaded event
      this.events.publish('dashboard:plugin-unloaded', { pluginId: id });
    } catch (error) {
      this.events.publish('dashboard:plugin-error', {
        pluginId: id,
        error: String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Enable a plugin
   * 
   * @param id Plugin ID
   * @returns True if plugin was enabled
   */
  public enablePlugin(id: string): boolean {
    const plugin = pluginRegistry.getPlugin(id);
    
    if (!plugin) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    if (plugin.status !== 'initialized') {
      throw new Error(`Plugin ${id} is not initialized`);
    }
    
    pluginRegistry.enablePlugin(id);
    
    // Publish plugin enabled event
    this.events.publish('dashboard:plugin-enabled', { 
      pluginId: id,
      pluginName: plugin.manifest.name
    });
    
    return true;
  }
  
  /**
   * Disable a plugin
   * 
   * @param id Plugin ID
   * @returns True if plugin was disabled
   */
  public disablePlugin(id: string): boolean {
    const plugin = pluginRegistry.getPlugin(id);
    
    if (!plugin) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    pluginRegistry.disablePlugin(id);
    
    // Publish plugin disabled event
    this.events.publish('dashboard:plugin-disabled', { 
      pluginId: id,
      pluginName: plugin.manifest.name
    });
    
    return true;
  }
  
  /**
   * Get all registered plugins
   * 
   * @returns Array of plugin information
   */
  public getAllPlugins(): Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    author: { name: string; email?: string; url?: string };
    enabled: boolean;
    status: string;
  }> {
    return pluginRegistry.getAllPlugins().map(entry => ({
      id: entry.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      description: entry.manifest.description,
      author: entry.manifest.author,
      enabled: entry.enabled,
      status: entry.status
    }));
  }
  
  /**
   * Get enabled plugins
   * 
   * @returns Array of enabled plugin information
   */
  public getEnabledPlugins(): Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    author: { name: string; email?: string; url?: string };
    status: string;
  }> {
    return pluginRegistry.getEnabledPlugins().map(entry => ({
      id: entry.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      description: entry.manifest.description,
      author: entry.manifest.author,
      status: entry.status
    }));
  }
  
  /**
   * Get plugin details
   * 
   * @param id Plugin ID
   * @returns Plugin details or undefined if not found
   */
  public getPluginDetails(id: string): {
    id: string;
    name: string;
    version: string;
    description: string;
    author: { name: string; email?: string; url?: string };
    license: string;
    repository?: string;
    keywords?: string[];
    enabled: boolean;
    status: string;
    dependencies: Array<{
      id: string;
      name: string;
      version: string;
      optional?: boolean;
    }>;
    components: number;
  } | undefined {
    const entry = pluginRegistry.getPlugin(id);
    
    if (!entry) {
      return undefined;
    }
    
    return {
      id: entry.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      description: entry.manifest.description,
      author: entry.manifest.author,
      license: entry.manifest.license,
      repository: entry.manifest.repository,
      keywords: entry.manifest.keywords,
      enabled: entry.enabled,
      status: entry.status,
      dependencies: entry.dependencies.map(depId => {
        const dep = pluginRegistry.getPlugin(depId);
        return dep ? {
          id: dep.id,
          name: dep.manifest.name,
          version: dep.manifest.version,
          optional: entry.manifest.dependencies?.find(d => d.id === depId)?.optional
        } : { id: depId, name: 'Unknown', version: 'Unknown' };
      }),
      components: entry.manifest.dashboard?.panels?.length || 0
    };
  }
  
  /**
   * Create API instance for a plugin
   * 
   * @param manifest Plugin manifest
   * @returns Plugin API instance
   */
  private createApiForPlugin(manifest: PluginManifest): PluginAPI {
    return createPluginAPI(
      manifest,
      this.dashboard,
      this.mathJs,
      this.storage,
      this.events,
      this.ui
    );
  }
  
  /**
   * Search for plugins in the repository
   * 
   * @param query Search query
   * @param filters Optional filters
   * @returns Promise resolving to plugin search results
   */
  public async searchPluginRepository(
    query: string,
    filters?: {
      type?: 'official' | 'community';
      keywords?: string[];
    }
  ): Promise<Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    author: { name: string; email?: string; url?: string };
    keywords: string[];
    compatibility: { mathJs: string; dashboard: string };
    type: 'official' | 'community';
  }>> {
    if (!this.repositoryConnector) {
      throw new Error('Plugin repository not configured');
    }
    
    return this.repositoryConnector.searchPlugins(query, filters);
  }
  
  /**
   * Get plugin details from the repository
   * 
   * @param pluginId The plugin ID
   * @returns Promise resolving to plugin details
   */
  public async getPluginRepositoryDetails(pluginId: string): Promise<{
    id: string;
    name: string;
    version: string;
    description: string;
    author: { name: string; email?: string; url?: string };
    keywords: string[];
    compatibility: { mathJs: string; dashboard: string };
    type: 'official' | 'community';
  }> {
    if (!this.repositoryConnector) {
      throw new Error('Plugin repository not configured');
    }
    
    return this.repositoryConnector.getPluginDetails(pluginId);
  }
  
  /**
   * Install a plugin from the repository
   * 
   * @param pluginId The plugin ID
   * @returns Promise resolving when the plugin is installed
   */
  public async installPluginFromRepository(pluginId: string): Promise<string> {
    if (!this.repositoryConnector) {
      throw new Error('Plugin repository not configured');
    }
    
    // Get plugin details
    const plugin = await this.repositoryConnector.getPluginDetails(pluginId);
    
    // Fetch the plugin manifest
    const manifest = await this.repositoryConnector.fetchPluginManifest(pluginId);
    
    // Register the plugin
    const registeredId = await this.registerPlugin(manifest);
    
    // Download and install the plugin
    await this.repositoryConnector.downloadPlugin(pluginId);
    
    // TODO: Extract the plugin package and load it
    // This would be implemented based on how plugin packages are handled
    
    // Publish plugin installed event
    this.events.publish('dashboard:plugin-installed', { 
      pluginId: registeredId,
      pluginName: plugin.name,
      version: plugin.version
    });
    
    return registeredId;
  }
}

// Export a factory function to create the plugin manager
export function createPluginManager(
  dashboard: DashboardAPI,
  mathJs: unknown,
  storage: PluginStorageAPI,
  events: PluginEventAPI,
  ui: PluginUIAPI,
  options?: PluginManagerOptions
): PluginManager {
  return new PluginManager(dashboard, mathJs, storage, events, ui, options);
}