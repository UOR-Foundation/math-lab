/**
 * Plugin Development SDK Types
 * 
 * Type definitions for plugin developers
 */

// Import base types from the plugin system
import type { 
  PluginManifest,
  PluginInstance,
  PluginAPI,
  DashboardAPI,
  PluginStorageAPI,
  PluginEventAPI,
  PluginUIAPI,
  PluginPermission
} from '../types';

// Re-export types that plugin developers need
export type {
  PluginManifest,
  PluginInstance,
  PluginAPI,
  DashboardAPI,
  PluginStorageAPI,
  PluginEventAPI,
  PluginUIAPI,
  PluginPermission
};

/**
 * Plugin context provided to plugin methods
 */
export interface PluginContext {
  api: PluginAPI;
  config: Record<string, unknown>;
}

// This context is exported by the interface declaration above

/**
 * Plugin initialization result
 */
export interface PluginInitResult {
  success: boolean;
  error?: string;
}

/**
 * Plugin method definition
 */
export interface PluginMethod {
  (context: PluginContext, ...args: unknown[]): unknown;
}

/**
 * Plugin event handler definition
 */
export interface PluginEventHandler {
  (context: PluginContext, event: unknown): void;
}

/**
 * Component props with dashboard API
 */
export interface PluginComponentProps {
  dashboard: DashboardAPI;
  storage: PluginStorageAPI;
  events: PluginEventAPI;
  ui: PluginUIAPI;
  config?: Record<string, unknown>;
}

/**
 * Plugin component definition
 */
export type PluginComponent = React.ComponentType<PluginComponentProps>;

/**
 * Visualization component props with visualization data
 */
export interface VisualizationComponentProps extends PluginComponentProps {
  data: unknown;
  width: number;
  height: number;
}

/**
 * Visualization component definition
 */
export type VisualizationComponent = React.ComponentType<VisualizationComponentProps>;

/**
 * Plugin metadata for decorators
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  license: string;
  keywords?: string[];
  repository?: string;
  components?: {
    panels?: Record<string, PluginComponent>;
    visualizations?: Record<string, VisualizationComponent>;
  };
  methods?: Record<string, PluginMethod>;
  events?: Record<string, PluginEventHandler>;
  permissions?: PluginPermission[];
}
