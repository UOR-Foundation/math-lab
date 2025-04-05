/**
 * Plugin Registry
 * 
 * Manages the registration and tracking of plugins within the system.
 */

import { PluginManifest, PluginInstance, PluginRegistryEntry, PluginStatus } from './types';

/**
 * The PluginRegistry is responsible for tracking all plugins in the system,
 * their dependencies, and their current status.
 */
export class PluginRegistry {
  private plugins: Map<string, PluginRegistryEntry> = new Map();

  /**
   * Register a plugin with the registry
   * 
   * @param manifest The plugin manifest
   * @returns The registered plugin entry
   */
  public register(manifest: PluginManifest): PluginRegistryEntry {
    // Check if the plugin is already registered
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already registered`);
    }
    
    // Create registry entry
    const entry: PluginRegistryEntry = {
      id: manifest.id,
      manifest,
      enabled: false,
      status: 'registered',
      dependencies: manifest.dependencies?.map(dep => dep.id) || [],
      dependents: [],
    };
    
    // Register the plugin
    this.plugins.set(manifest.id, entry);
    
    // Update dependency relationships
    this.updateDependencyRelationships(entry);
    
    return entry;
  }

  /**
   * Update a plugin's instance and status
   * 
   * @param id The plugin ID
   * @param instance The plugin instance
   * @param status The plugin status
   */
  public updatePlugin(id: string, instance: PluginInstance, status: PluginStatus): void {
    const entry = this.getPlugin(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    entry.instance = instance;
    entry.status = status;
    
    this.plugins.set(id, entry);
  }

  /**
   * Set a plugin's error state
   * 
   * @param id The plugin ID
   * @param error The error that occurred
   */
  public setPluginError(id: string, error: Error): void {
    const entry = this.getPlugin(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    entry.error = error;
    entry.status = 'error';
    
    this.plugins.set(id, entry);
  }

  /**
   * Enable a plugin
   * 
   * @param id The plugin ID
   */
  public enablePlugin(id: string): void {
    const entry = this.getPlugin(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    entry.enabled = true;
    this.plugins.set(id, entry);
  }

  /**
   * Disable a plugin
   * 
   * @param id The plugin ID
   */
  public disablePlugin(id: string): void {
    const entry = this.getPlugin(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    entry.enabled = false;
    this.plugins.set(id, entry);
  }

  /**
   * Get a plugin by ID
   * 
   * @param id The plugin ID
   * @returns The plugin registry entry or undefined
   */
  public getPlugin(id: string): PluginRegistryEntry | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all registered plugins
   * 
   * @returns Array of plugin registry entries
   */
  public getAllPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   * 
   * @returns Array of enabled plugin registry entries
   */
  public getEnabledPlugins(): PluginRegistryEntry[] {
    return this.getAllPlugins().filter(plugin => plugin.enabled);
  }

  /**
   * Check if all dependencies are satisfied for a plugin
   * 
   * @param id The plugin ID
   * @returns True if all dependencies are satisfied
   */
  public areDependenciesSatisfied(id: string): boolean {
    const entry = this.getPlugin(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    // If no dependencies, they're satisfied by default
    if (entry.dependencies.length === 0) {
      return true;
    }
    
    // Check each dependency
    return entry.dependencies.every(depId => {
      const dep = this.getPlugin(depId);
      
      // If the dependency is not found or has an error, it's not satisfied
      if (!dep || dep.status === 'error') {
        return false;
      }
      
      // Check if dependency is optional
      const depDef = entry.manifest.dependencies?.find(d => d.id === depId);
      if (depDef?.optional) {
        return true;
      }
      
      // Dependency must be enabled and initialized
      return dep.enabled && dep.status === 'initialized';
    });
  }

  /**
   * Get plugins that depend on the specified plugin
   * 
   * @param id The plugin ID
   * @returns Array of dependent plugin registry entries
   */
  public getDependents(id: string): PluginRegistryEntry[] {
    const entry = this.getPlugin(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    return entry.dependents.map(depId => this.getPlugin(depId)!);
  }

  /**
   * Get plugins that the specified plugin depends on
   * 
   * @param id The plugin ID
   * @returns Array of dependency plugin registry entries
   */
  public getDependencies(id: string): PluginRegistryEntry[] {
    const entry = this.getPlugin(id);
    if (!entry) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    return entry.dependencies
      .map(depId => this.getPlugin(depId))
      .filter((dep): dep is PluginRegistryEntry => dep !== undefined);
  }

  /**
   * Check if a plugin exists in the registry
   * 
   * @param id The plugin ID
   * @returns True if the plugin exists
   */
  public hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Remove a plugin from the registry
   * 
   * @param id The plugin ID
   */
  public unregisterPlugin(id: string): void {
    // Check if the plugin exists
    if (!this.plugins.has(id)) {
      throw new Error(`Plugin ${id} is not registered`);
    }
    
    // Get the plugin entry
    const entry = this.getPlugin(id)!;
    
    // Check if any dependents exist and are not optional
    const blockedBy = this.getAllPlugins().filter(plugin => {
      // If the plugin depends on the one being removed
      if (plugin.dependencies.includes(id)) {
        // Check if it's an optional dependency
        const depDef = plugin.manifest.dependencies?.find(d => d.id === id);
        return !depDef?.optional;
      }
      return false;
    });
    
    if (blockedBy.length > 0) {
      throw new Error(
        `Cannot unregister plugin ${id} because it is required by: ${blockedBy.map(p => p.id).join(', ')}`
      );
    }
    
    // Update dependency relationships
    entry.dependents.forEach(depId => {
      const dep = this.getPlugin(depId);
      if (dep) {
        // Remove this plugin from the dependent's dependencies
        const depDef = dep.manifest.dependencies?.find(d => d.id === id);
        if (depDef?.optional) {
          // If optional, just mark it as satisfied through other means
          // In a real implementation, we might want to notify the plugin
        }
      }
    });
    
    // Remove the plugin
    this.plugins.delete(id);
  }

  /**
   * Clear all plugins from the registry
   */
  public clear(): void {
    this.plugins.clear();
  }

  /**
   * Update dependency relationships when a new plugin is registered
   * 
   * @param entry The new plugin entry
   */
  private updateDependencyRelationships(entry: PluginRegistryEntry): void {
    // For each dependency of this plugin
    entry.dependencies.forEach(depId => {
      const dep = this.getPlugin(depId);
      if (dep) {
        // Add this plugin as a dependent of its dependency
        if (!dep.dependents.includes(entry.id)) {
          dep.dependents.push(entry.id);
          this.plugins.set(depId, dep);
        }
      }
    });
  }
}

// Export a singleton instance
export const pluginRegistry = new PluginRegistry();