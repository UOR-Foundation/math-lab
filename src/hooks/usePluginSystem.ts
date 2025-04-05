/**
 * Hook for accessing the plugin system API in React components
 */

import { useCallback } from 'react';
import { getPluginApiService } from '../core/plugin-system/service';
import type { PluginManifest } from '../core/plugin-system/types';

/**
 * Hook for accessing the plugin system
 * 
 * @returns Plugin system utilities
 */
export function usePluginSystem() {
  const apiService = getPluginApiService();
  const pluginManager = apiService.getPluginManager();
  
  /**
   * Load a plugin
   * 
   * @param id Plugin ID or URL
   * @returns Promise resolving when plugin is loaded
   */
  const loadPlugin = useCallback(
    async (id: string) => {
      return pluginManager.loadPlugin(id);
    },
    [pluginManager]
  );
  
  /**
   * Register a plugin manifest
   * 
   * @param manifest Plugin manifest
   * @returns Promise resolving to plugin ID
   */
  const registerPlugin = useCallback(
    async (manifest: PluginManifest) => {
      return pluginManager.registerPlugin(manifest);
    },
    [pluginManager]
  );
  
  /**
   * Enable a plugin
   * 
   * @param id Plugin ID
   * @returns True if plugin was enabled
   */
  const enablePlugin = useCallback(
    (id: string) => {
      return pluginManager.enablePlugin(id);
    },
    [pluginManager]
  );
  
  /**
   * Disable a plugin
   * 
   * @param id Plugin ID
   * @returns True if plugin was disabled
   */
  const disablePlugin = useCallback(
    (id: string) => {
      return pluginManager.disablePlugin(id);
    },
    [pluginManager]
  );
  
  /**
   * Unload a plugin
   * 
   * @param id Plugin ID
   * @returns Promise resolving when plugin is unloaded
   */
  const unloadPlugin = useCallback(
    async (id: string) => {
      return pluginManager.unloadPlugin(id);
    },
    [pluginManager]
  );
  
  /**
   * Get all plugins
   * 
   * @returns Array of plugin information
   */
  const getAllPlugins = useCallback(
    () => {
      return pluginManager.getAllPlugins();
    },
    [pluginManager]
  );
  
  /**
   * Get enabled plugins
   * 
   * @returns Array of enabled plugin information
   */
  const getEnabledPlugins = useCallback(
    () => {
      return pluginManager.getEnabledPlugins();
    },
    [pluginManager]
  );
  
  /**
   * Get plugin details
   * 
   * @param id Plugin ID
   * @returns Plugin details or undefined if not found
   */
  const getPluginDetails = useCallback(
    (id: string) => {
      return pluginManager.getPluginDetails(id);
    },
    [pluginManager]
  );
  
  return {
    loadPlugin,
    registerPlugin,
    enablePlugin,
    disablePlugin,
    unloadPlugin,
    getAllPlugins,
    getEnabledPlugins,
    getPluginDetails,
    pluginManager,
  };
}
