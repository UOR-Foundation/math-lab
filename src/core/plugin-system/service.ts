/**
 * Plugin API Service
 * 
 * Provides a unified service for managing plugin APIs and interactions
 * with the dashboard.
 */

import { 
  DashboardAPI, 
  PluginStorageAPI, 
  PluginEventAPI, 
  PluginUIAPI,
} from './types';

import { 
  createDashboardApiImpl, 
  createStorageApiImpl, 
  createEventApiImpl, 
  createUiApiImpl,
  eventBus
} from './implementations';

import { PluginManager, createPluginManager } from './manager';

/**
 * Plugin API Service
 * 
 * Central service for managing plugin system APIs and interactions.
 */
export class PluginApiService {
  private static instance: PluginApiService;
  
  // API implementations
  private dashboardApi: DashboardAPI;
  private storageApi: PluginStorageAPI;
  private eventApi: PluginEventAPI;
  private uiApi: PluginUIAPI;
  
  // Plugin manager
  private pluginManager: PluginManager;
  
  // Math-js library reference
  private mathJs: unknown;
  
  /**
   * Private constructor for singleton
   */
  private constructor() {
    // Create API implementations
    this.dashboardApi = createDashboardApiImpl();
    this.storageApi = createStorageApiImpl();
    this.eventApi = createEventApiImpl();
    this.uiApi = createUiApiImpl();
    
    // Initialize with empty math-js reference (will be set later)
    this.mathJs = {};
    
    // Create plugin manager
    this.pluginManager = createPluginManager(
      this.dashboardApi,
      this.mathJs,
      this.storageApi,
      this.eventApi,
      this.uiApi,
      {
        autoEnable: true,
        pluginDirectory: './plugins',
        allowRemotePlugins: false
      }
    );
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PluginApiService {
    if (!PluginApiService.instance) {
      PluginApiService.instance = new PluginApiService();
    }
    return PluginApiService.instance;
  }
  
  /**
   * Set the math-js library reference
   * 
   * @param mathJs Math-js library instance
   */
  public setMathJs(mathJs: unknown): void {
    this.mathJs = mathJs;
  }
  
  /**
   * Get the plugin manager
   */
  public getPluginManager(): PluginManager {
    return this.pluginManager;
  }
  
  /**
   * Get the dashboard API
   */
  public getDashboardApi(): DashboardAPI {
    return this.dashboardApi;
  }
  
  /**
   * Get the storage API
   */
  public getStorageApi(): PluginStorageAPI {
    return this.storageApi;
  }
  
  /**
   * Get the event API
   */
  public getEventApi(): PluginEventAPI {
    return this.eventApi;
  }
  
  /**
   * Get the UI API
   */
  public getUiApi(): PluginUIAPI {
    return this.uiApi;
  }
  
  /**
   * Get the event bus
   */
  public getEventBus(): typeof eventBus {
    return eventBus;
  }
}

// Export singleton instance getter
export const getPluginApiService = PluginApiService.getInstance;