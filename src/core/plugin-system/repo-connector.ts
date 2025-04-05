/**
 * Plugin Repository Connector
 * 
 * This module provides functionality to connect to the Math Lab Plugin Repository,
 * browse available plugins, and install plugins from the repository.
 */

import { PluginManifest } from './types';

/**
 * Repository Plugin metadata
 */
export interface RepositoryPluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  keywords: string[];
  compatibility: {
    mathJs: string;
    dashboard: string;
  };
  type: 'official' | 'community';
  path: string;
  lastUpdated: string;
}

/**
 * Repository index
 */
export interface RepositoryIndex {
  schemaVersion: string;
  lastUpdated: string;
  plugins: RepositoryPluginMetadata[];
}

/**
 * Plugin Repository Connector class
 */
export class PluginRepositoryConnector {
  private repositoryUrl: string;
  private index: RepositoryIndex | null = null;
  
  /**
   * Constructor
   * @param repositoryUrl The URL of the plugin repository
   */
  constructor(repositoryUrl: string = 'https://plugins.math-lab.uor-foundation.org') {
    this.repositoryUrl = repositoryUrl;
  }
  
  /**
   * Fetch the repository index
   * @returns The repository index
   */
  public async fetchIndex(): Promise<RepositoryIndex> {
    try {
      const response = await fetch(`${this.repositoryUrl}/registry/index.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch repository index: ${response.statusText}`);
      }
      
      this.index = await response.json() as RepositoryIndex;
      return this.index;
    } catch (error) {
      console.error('Error fetching plugin repository index:', error);
      throw error;
    }
  }
  
  /**
   * Get the repository index
   * @returns The repository index
   */
  public getIndex(): RepositoryIndex | null {
    return this.index;
  }
  
  /**
   * Search for plugins
   * @param query The search query
   * @param filters Optional filters
   * @returns Matching plugins
   */
  public async searchPlugins(
    query: string,
    filters?: {
      type?: 'official' | 'community';
      keywords?: string[];
    }
  ): Promise<RepositoryPluginMetadata[]> {
    if (!this.index) {
      await this.fetchIndex();
    }
    
    if (!this.index) {
      throw new Error('Failed to fetch repository index');
    }
    
    let results = this.index.plugins;
    
    // Apply type filter
    if (filters?.type) {
      results = results.filter(plugin => plugin.type === filters.type);
    }
    
    // Apply keyword filter
    if (filters?.keywords && filters.keywords.length > 0) {
      results = results.filter(plugin => 
        filters.keywords!.every(keyword => 
          plugin.keywords.includes(keyword)
        )
      );
    }
    
    // Apply search query
    if (query) {
      const normalizedQuery = query.toLowerCase();
      results = results.filter(plugin => 
        plugin.name.toLowerCase().includes(normalizedQuery) ||
        plugin.description.toLowerCase().includes(normalizedQuery) ||
        plugin.keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery))
      );
    }
    
    return results;
  }
  
  /**
   * Get plugin details
   * @param pluginId The plugin ID
   * @returns The plugin details
   */
  public async getPluginDetails(pluginId: string): Promise<RepositoryPluginMetadata> {
    if (!this.index) {
      await this.fetchIndex();
    }
    
    if (!this.index) {
      throw new Error('Failed to fetch repository index');
    }
    
    const plugin = this.index.plugins.find(p => p.id === pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }
    
    return plugin;
  }
  
  /**
   * Fetch plugin manifest
   * @param pluginId The plugin ID
   * @returns The plugin manifest
   */
  public async fetchPluginManifest(pluginId: string): Promise<PluginManifest> {
    const plugin = await this.getPluginDetails(pluginId);
    
    try {
      const response = await fetch(`${this.repositoryUrl}/${plugin.path}/manifest.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch plugin manifest: ${response.statusText}`);
      }
      
      return await response.json() as PluginManifest;
    } catch (error) {
      console.error(`Error fetching manifest for plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * Download plugin package
   * @param pluginId The plugin ID
   * @returns The plugin package
   */
  public async downloadPlugin(pluginId: string): Promise<Blob> {
    const plugin = await this.getPluginDetails(pluginId);
    
    try {
      const response = await fetch(`${this.repositoryUrl}/${plugin.path}/math-js-plugin-${pluginId}-${plugin.version}.zip`);
      if (!response.ok) {
        throw new Error(`Failed to download plugin: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error(`Error downloading plugin ${pluginId}:`, error);
      throw error;
    }
  }
}

/**
 * Create a plugin repository connector
 * @param repositoryUrl The URL of the plugin repository
 * @returns A plugin repository connector
 */
export function createPluginRepositoryConnector(
  repositoryUrl?: string
): PluginRepositoryConnector {
  return new PluginRepositoryConnector(repositoryUrl);
}