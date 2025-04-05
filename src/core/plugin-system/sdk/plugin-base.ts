/**
 * Plugin Base Class
 * 
 * Provides a base class for creating plugins with TypeScript
 */

import {
  PluginManifest,
  PluginInstance,
  PluginMetadata,
  PluginContext,
  PluginMethod,
  PluginEventHandler,
  PluginComponent,
  VisualizationComponent,
} from './types';

import { createManifest, createPluginInstance } from './helpers';

/**
 * Abstract base class for creating plugins
 */
export abstract class PluginBase {
  private metadata: PluginMetadata;
  private _id: string;
  private _compatibility: { mathJs: string; dashboard: string };
  
  /**
   * Create a new plugin
   * 
   * @param id Unique plugin identifier
   * @param metadata Plugin metadata
   * @param compatibility Plugin compatibility
   */
  constructor(
    id: string,
    metadata: PluginMetadata,
    compatibility: { mathJs: string; dashboard: string } = { mathJs: '^1.0.0', dashboard: '^1.0.0' }
  ) {
    this._id = id;
    this.metadata = metadata;
    this._compatibility = compatibility;
  }
  
  /**
   * Plugin initialization function
   * 
   * Override this in your plugin to perform initialization tasks
   * 
   * @param context Plugin context with API and configuration
   * @returns Initialization result
   */
  async initialize(context: PluginContext): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
  
  /**
   * Plugin cleanup function
   * 
   * Override this in your plugin to perform cleanup tasks
   * 
   * @returns Cleanup result
   */
  async cleanup(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
  
  /**
   * Get plugin manifest
   * 
   * @returns Plugin manifest
   */
  getManifest(): PluginManifest {
    return createManifest(this._id, this.metadata, this._compatibility);
  }
  
  /**
   * Get plugin instance
   * 
   * @returns Plugin instance
   */
  getInstance(): PluginInstance {
    const self = this;
    
    return {
      // Initialize the plugin
      initialize: async (dashboard, mathJs, config) => {
        try {
          // Create context for plugin initialization
          const context: PluginContext = {
            api: {
              dashboard,
              mathJs,
              storage: {} as any, // These will be properly injected by the plugin system
              events: {} as any,
              ui: {} as any,
            },
            config: config as Record<string, unknown>,
          };
          
          // Call plugin's initialize method
          return await self.initialize(context);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to initialize plugin: ${this.metadata.name}`, errorMessage);
          return { success: false, error: errorMessage };
        }
      },
      
      // Clean up the plugin
      cleanup: async () => {
        try {
          return await self.cleanup();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to clean up plugin: ${this.metadata.name}`, errorMessage);
          return { success: false, error: errorMessage };
        }
      },
      
      // Plugin components
      components: this.metadata.components,
      
      // Plugin methods
      methods: this.metadata.methods,
      
      // Plugin event handlers
      events: this.metadata.events,
    };
  }
  
  /**
   * Register a panel component
   * 
   * @param id Component ID
   * @param component Panel component
   */
  registerPanel(id: string, component: PluginComponent): void {
    if (!this.metadata.components) {
      this.metadata.components = {};
    }
    
    if (!this.metadata.components.panels) {
      this.metadata.components.panels = {};
    }
    
    this.metadata.components.panels[id] = component;
  }
  
  /**
   * Register a visualization component
   * 
   * @param id Component ID
   * @param component Visualization component
   */
  registerVisualization(id: string, component: VisualizationComponent): void {
    if (!this.metadata.components) {
      this.metadata.components = {};
    }
    
    if (!this.metadata.components.visualizations) {
      this.metadata.components.visualizations = {};
    }
    
    this.metadata.components.visualizations[id] = component;
  }
  
  /**
   * Register a method
   * 
   * @param id Method ID
   * @param method Plugin method
   */
  registerMethod(id: string, method: PluginMethod): void {
    if (!this.metadata.methods) {
      this.metadata.methods = {};
    }
    
    this.metadata.methods[id] = method;
  }
  
  /**
   * Register an event handler
   * 
   * @param eventName Event name
   * @param handler Event handler
   */
  registerEventHandler(eventName: string, handler: PluginEventHandler): void {
    if (!this.metadata.events) {
      this.metadata.events = {};
    }
    
    this.metadata.events[eventName] = handler;
  }
}
