/**
 * Plugin Development SDK Helpers
 * 
 * Utility functions to assist plugin development
 */

import { PluginManifest, PluginInstance, PluginMetadata } from './types';

/**
 * Create a plugin manifest from metadata
 *
 * @param id Unique plugin identifier
 * @param metadata Plugin metadata
 * @param compatibility Plugin compatibility
 * @returns Plugin manifest
 */
export function createManifest(
  id: string,
  metadata: PluginMetadata,
  compatibility: { mathJs: string; dashboard: string } = { mathJs: '^1.0.0', dashboard: '^1.0.0' }
): PluginManifest {
  return {
    id,
    name: metadata.name,
    version: metadata.version,
    compatibility,
    author: metadata.author,
    license: metadata.license,
    description: metadata.description,
    keywords: metadata.keywords,
    repository: metadata.repository,
    entryPoint: './index.js',
    permissions: metadata.permissions || [],
  };
}

/**
 * Create a plugin instance
 *
 * @param metadata Plugin metadata
 * @returns Plugin instance
 */
export function createPluginInstance(metadata: PluginMetadata): PluginInstance {
  return {
    // Initialize the plugin
    initialize: async (_dashboard, _mathJs, _config) => {
      try {
        console.log(`Initializing plugin: ${metadata.name}`);
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to initialize plugin: ${metadata.name}`, errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    // Clean up the plugin
    cleanup: async () => {
      try {
        console.log(`Cleaning up plugin: ${metadata.name}`);
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to clean up plugin: ${metadata.name}`, errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    
    // Plugin components
    components: metadata.components,
    
    // Plugin methods
    // Need to cast to satisfy TypeScript
    methods: metadata.methods as Record<string, (...args: unknown[]) => unknown> | undefined,
    
    // Plugin event handlers
    // Need to cast to satisfy TypeScript
    events: metadata.events as Record<string, (event: unknown) => void> | undefined,
  };
}

/**
 * Create a complete plugin package
 *
 * @param id Unique plugin identifier
 * @param metadata Plugin metadata
 * @param compatibility Plugin compatibility
 * @returns Plugin manifest and instance
 */
export function createPlugin(
  id: string,
  metadata: PluginMetadata,
  compatibility?: { mathJs: string; dashboard: string }
): { manifest: PluginManifest; instance: PluginInstance } {
  return {
    manifest: createManifest(id, metadata, compatibility),
    instance: createPluginInstance(metadata)
  };
}
