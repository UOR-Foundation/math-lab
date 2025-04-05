/**
 * Plugin Development SDK Testing Utilities
 * 
 * Utilities for testing plugins during development
 */

import { 
  PluginManifest,
  PluginInstance, 
  DashboardAPI,
  PluginStorageAPI,
  PluginEventAPI,
  PluginUIAPI,
  PluginAPI,
  PluginMethod,
  PluginEventHandler,
  PluginComponent
} from './types';
import { vi } from 'vitest';

/**
 * Create a mock dashboard API for testing
 * 
 * @returns Mock dashboard API
 */
export function createMockDashboardAPI(): DashboardAPI {
  return {
    registerTool: vi.fn(),
    registerPanel: vi.fn(),
    registerVisualization: vi.fn(),
    showResult: vi.fn(),
    showError: vi.fn(),
    updateProgressBar: vi.fn()
  };
}

/**
 * Create a mock storage API for testing
 * 
 * @returns Mock storage API
 */
export function createMockStorageAPI(): PluginStorageAPI {
  return {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue([])
  };
}

/**
 * Create a mock event API for testing
 * 
 * @returns Mock event API
 */
export function createMockEventAPI(): PluginEventAPI {
  return {
    subscribe: vi.fn().mockReturnValue(() => {}),
    publish: vi.fn()
  };
}

/**
 * Create a mock UI API for testing
 * 
 * @returns Mock UI API
 */
export function createMockUIAPI(): PluginUIAPI {
  return {
    showNotification: vi.fn(),
    showModal: vi.fn().mockResolvedValue(undefined),
    showConfirm: vi.fn().mockResolvedValue(true)
  };
}

/**
 * Create a complete mock plugin API for testing
 * 
 * @param overrides Any API parts to override
 * @returns Mock plugin API
 */
export function createMockPluginAPI(overrides?: Partial<PluginAPI>): PluginAPI {
  const mathJs = {
    version: '1.0.0',
    // Add mock math-js functions as needed
  };
  
  return {
    dashboard: overrides?.dashboard || createMockDashboardAPI(),
    mathJs: overrides?.mathJs || mathJs,
    storage: overrides?.storage || createMockStorageAPI(),
    events: overrides?.events || createMockEventAPI(),
    ui: overrides?.ui || createMockUIAPI()
  };
}

/**
 * Plugin test harness for testing plugins
 */
export class PluginTestHarness {
  private instance: PluginInstance;
  private api: PluginAPI;
  
  /**
   * Create a new plugin test harness
   * 
   * @param manifest Plugin manifest
   * @param instance Plugin instance
   * @param api Optional mock API (defaults to standard mocks)
   */
  constructor(
    _manifest: PluginManifest,
    instance: PluginInstance,
    api?: PluginAPI
  ) {
    this.instance = instance;
    this.api = api || createMockPluginAPI();
  }
  
  /**
   * Initialize the plugin
   * 
   * @param config Optional configuration
   * @returns Initialization result
   */
  async initialize(config?: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    return this.instance.initialize(
      this.api.dashboard, 
      this.api.mathJs, 
      config || {}
    );
  }
  
  /**
   * Clean up the plugin
   * 
   * @returns Cleanup result
   */
  async cleanup(): Promise<{ success: boolean; error?: string }> {
    return this.instance.cleanup();
  }
  
  /**
   * Call a plugin method
   * 
   * @param methodName Method name
   * @param args Method arguments
   * @returns Method result
   */
  async callMethod(methodName: string, ...args: unknown[]): Promise<unknown> {
    if (!this.instance.methods || !this.instance.methods[methodName]) {
      throw new Error(`Method not found: ${methodName}`);
    }
    
    const context = {
      api: this.api,
      config: {}
    };
    
    const method = this.instance.methods[methodName] as PluginMethod;
    return method(context, ...args);
  }
  
  /**
   * Trigger an event handler
   * 
   * @param eventName Event name
   * @param eventData Event data
   * @returns void
   */
  triggerEvent(eventName: string, eventData: unknown): void {
    if (!this.instance.events || !this.instance.events[eventName]) {
      throw new Error(`Event handler not found: ${eventName}`);
    }
    
    const context = {
      api: this.api,
      config: {}
    };
    
    const handler = this.instance.events[eventName] as PluginEventHandler;
    handler(context, eventData);
  }
  
  /**
   * Get a panel component
   * 
   * @param panelId Panel ID
   * @returns Panel component or undefined if not found
   */
  getPanelComponent(panelId: string): PluginComponent | undefined {
    if (!this.instance.components?.panels) {
      return undefined;
    }
    
    return this.instance.components.panels[panelId] as PluginComponent;
  }
  
  /**
   * Get API mock for a specific API
   * 
   * @returns API mocks
   */
  getMocks() {
    return {
      dashboard: this.api.dashboard,
      storage: this.api.storage,
      events: this.api.events,
      ui: this.api.ui
    };
  }
}

/**
 * Create a plugin test harness
 * 
 * @param manifest Plugin manifest
 * @param instance Plugin instance
 * @param api Optional mock API
 * @returns Plugin test harness
 */
export function createPluginTestHarness(
  manifest: PluginManifest,
  instance: PluginInstance,
  api?: PluginAPI
): PluginTestHarness {
  return new PluginTestHarness(manifest, instance, api);
}