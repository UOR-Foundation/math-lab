/**
 * Plugin System Types
 * 
 * This file defines the TypeScript interfaces and types for the plugin system.
 */

/**
 * Plugin manifest containing metadata and capabilities
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  compatibility: {
    mathJs: string;
    dashboard: string;
  };
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  license: string;
  description: string;
  keywords?: string[];
  repository?: string;
  entryPoint: string;
  dependencies?: PluginDependency[];
  dashboard?: {
    panels?: PanelDefinition[];
    toolbarItems?: ToolbarItemDefinition[];
    visualizations?: VisualizationDefinition[];
    menu?: MenuItemDefinition[];
  };
  config?: {
    schema: Record<string, PluginConfigParameter>;
  };
  permissions?: PluginPermission[];
  resources?: {
    cpu?: 'low' | 'medium' | 'high';
    memory?: 'low' | 'medium' | 'high';
  };
  documentation?: {
    main?: string;
    api?: string;
  };
}

/**
 * Plugin dependency definition
 */
export interface PluginDependency {
  id: string;
  version: string;
  optional: boolean;
}

/**
 * Panel definition for dashboard integration
 */
export interface PanelDefinition {
  id: string;
  title: string;
  icon?: string;
  position: 'main' | 'sidebar' | 'results' | 'visualization';
  initialState?: {
    expanded?: boolean;
    width?: string;
    height?: string;
  };
}

/**
 * Toolbar item definition
 */
export interface ToolbarItemDefinition {
  id: string;
  title: string;
  icon: string;
  action: string;
  order?: number;
}

/**
 * Visualization definition
 */
export interface VisualizationDefinition {
  id: string;
  name: string;
  type: 'chart' | '2d' | '3d';
  supportsData: string[];
}

/**
 * Menu item definition
 */
export interface MenuItemDefinition {
  id: string;
  title: string;
  icon?: string;
  parent?: string;
  action?: string;
  order?: number;
}

/**
 * Plugin configuration parameter definition
 */
export interface PluginConfigParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: unknown;
  description?: string;
  min?: number;
  max?: number;
  options?: unknown[];
  required?: boolean;
}

/**
 * Plugin permissions
 */
export type PluginPermission = 
  | 'storage'
  | 'storage.local'
  | 'storage.cloud'
  | 'computation'
  | 'computation.intensive'
  | 'network'
  | 'clipboard'
  | 'notifications';

/**
 * Plugin instance returned by the plugin loader
 */
export interface Plugin {
  manifest: PluginManifest;
  instance: PluginInstance;
  enabled: boolean;
  status: PluginStatus;
  error?: Error;
}

/**
 * Plugin status
 */
export type PluginStatus = 
  | 'registered'  // Plugin is registered but not loaded
  | 'loaded'      // Plugin is loaded but not initialized
  | 'initialized' // Plugin is initialized and ready
  | 'error';      // Plugin failed to load or initialize

/**
 * Plugin API interfaces
 */
export interface PluginAPI {
  dashboard: DashboardAPI;
  mathJs: unknown; // This will be defined by math-js library
  storage: PluginStorageAPI;
  events: PluginEventAPI;
  ui: PluginUIAPI;
}

/**
 * Dashboard API available to plugins
 */
export interface DashboardAPI {
  registerTool: (tool: { id: string; name: string; icon: string; component: unknown }) => void;
  registerPanel: (panel: { id: string; component: unknown }) => void;
  registerVisualization: (visualization: { id: string; component: unknown }) => void;
  showResult: (result: unknown) => void;
  showError: (error: Error | string) => void;
  updateProgressBar: (progress: number) => void;
}

/**
 * Storage API available to plugins
 */
export interface PluginStorageAPI {
  getItem: (key: string) => Promise<unknown>;
  setItem: (key: string, value: unknown) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
}

/**
 * Event API available to plugins
 */
export interface PluginEventAPI {
  subscribe: (eventName: string, callback: (data: unknown) => void) => () => void;
  publish: (eventName: string, data: unknown) => void;
}

/**
 * UI API available to plugins
 */
export interface PluginUIAPI {
  showNotification: (message: string, options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }) => void;
  showModal: (title: string, content: unknown) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
}

/**
 * Plugin instance interface
 */
export interface PluginInstance {
  // Plugin initialization function
  initialize: (dashboard: DashboardAPI, mathJs: unknown, config: unknown) => Promise<{ success: boolean; error?: string }>;
  
  // Plugin cleanup function
  cleanup: () => Promise<{ success: boolean; error?: string }>;
  
  // UI Components exposed to dashboard
  components?: {
    panels?: Record<string, unknown>;
    visualizations?: Record<string, unknown>;
    toolbarItems?: Record<string, unknown>;
  };
  
  // Methods that extend math-js functionality
  methods?: Record<string, (...args: unknown[]) => unknown>;
  
  // Event listeners
  events?: Record<string, (event: unknown) => void>;
  
  // Public API for other plugins
  api?: Record<string, unknown>;
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  id: string;
  manifest: PluginManifest;
  instance?: PluginInstance;
  enabled: boolean;
  status: PluginStatus;
  dependencies: string[];
  dependents: string[];
  error?: Error;
}

/**
 * Plugin loader options
 */
export interface PluginLoaderOptions {
  url?: string;
  source?: string;
  sandbox?: boolean;
}

/**
 * Plugin manager options
 */
export interface PluginManagerOptions {
  autoEnable?: boolean;
  pluginDirectory?: string;
  allowRemotePlugins?: boolean;
}