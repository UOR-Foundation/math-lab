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
  default?: any;
  description?: string;
  min?: number;
  max?: number;
  options?: any[];
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
  mathJs: any; // This will be defined by math-js library
  storage: PluginStorageAPI;
  events: PluginEventAPI;
  ui: PluginUIAPI;
}

/**
 * Dashboard API available to plugins
 */
export interface DashboardAPI {
  registerTool: (tool: { id: string; name: string; icon: string; component: any }) => void;
  registerPanel: (panel: { id: string; component: any }) => void;
  registerVisualization: (visualization: { id: string; component: any }) => void;
  showResult: (result: any) => void;
  showError: (error: Error | string) => void;
  updateProgressBar: (progress: number) => void;
}

/**
 * Storage API available to plugins
 */
export interface PluginStorageAPI {
  getItem: (key: string) => Promise<any>;
  setItem: (key: string, value: any) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
}

/**
 * Event API available to plugins
 */
export interface PluginEventAPI {
  subscribe: (eventName: string, callback: (data: any) => void) => () => void;
  publish: (eventName: string, data: any) => void;
}

/**
 * UI API available to plugins
 */
export interface PluginUIAPI {
  showNotification: (message: string, options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }) => void;
  showModal: (title: string, content: any) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
}

/**
 * Plugin instance interface
 */
export interface PluginInstance {
  // Plugin initialization function
  initialize: (dashboard: DashboardAPI, mathJs: any, config: any) => Promise<{ success: boolean; error?: string }>;
  
  // Plugin cleanup function
  cleanup: () => Promise<{ success: boolean; error?: string }>;
  
  // UI Components exposed to dashboard
  components?: {
    panels?: Record<string, any>;
    visualizations?: Record<string, any>;
    toolbarItems?: Record<string, any>;
  };
  
  // Methods that extend math-js functionality
  methods?: Record<string, (...args: any[]) => any>;
  
  // Event listeners
  events?: Record<string, (event: any) => void>;
  
  // Public API for other plugins
  api?: Record<string, any>;
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