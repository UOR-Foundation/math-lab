/**
 * Plugin API Tests
 * 
 * Tests for the plugin API system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createPluginAPI,
  createPermissionCheck
} from '../../../../src/core/plugin-system/api';
import {
  PluginManifest,
  DashboardAPI,
  PluginStorageAPI,
  PluginEventAPI,
  PluginUIAPI,
  PluginPermission
} from '../../../../src/core/plugin-system/types';

// Mock the sandbox module's hasPermission function
vi.mock('../../../../src/core/plugin-system/sandbox', () => {
  return {
    hasPermission: (manifest: PluginManifest, permission: string) => {
      if (!manifest.permissions) return false;
      
      if (manifest.permissions.includes(permission as PluginPermission)) {
        return true;
      }
      
      // Check for parent permission (e.g., 'storage' grants 'storage.local')
      if (permission.includes('.')) {
        const parentPermission = permission.split('.')[0] as PluginPermission;
        return manifest.permissions.includes(parentPermission);
      }
      
      return false;
    }
  };
});

// Mock implementations for testing
const createMockDashboardAPI = (): DashboardAPI => ({
  registerTool: vi.fn(),
  registerPanel: vi.fn(),
  registerVisualization: vi.fn(),
  showResult: vi.fn(),
  showError: vi.fn(),
  updateProgressBar: vi.fn()
});

const createMockStorageAPI = (): PluginStorageAPI => ({
  getItem: vi.fn().mockResolvedValue(null),
  setItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  keys: vi.fn().mockResolvedValue([])
});

const createMockEventAPI = (): PluginEventAPI => ({
  subscribe: vi.fn().mockReturnValue(() => {}),
  publish: vi.fn()
});

const createMockUIAPI = (): PluginUIAPI => ({
  showNotification: vi.fn(),
  showModal: vi.fn().mockResolvedValue(undefined),
  showConfirm: vi.fn().mockResolvedValue(false)
});

describe('Plugin API', () => {
  let dashboardAPI: DashboardAPI;
  let storageAPI: PluginStorageAPI;
  let eventAPI: PluginEventAPI;
  let uiAPI: PluginUIAPI;
  let mathJs: unknown;
  
  beforeEach(() => {
    // Create fresh mocks for each test
    dashboardAPI = createMockDashboardAPI();
    storageAPI = createMockStorageAPI();
    eventAPI = createMockEventAPI();
    uiAPI = createMockUIAPI();
    mathJs = { version: '1.0.0' };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('createPluginAPI', () => {
    it('should create a plugin API instance', () => {
      // Create a minimal manifest
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js'
      };
      
      // Create the API
      const api = createPluginAPI(
        manifest,
        dashboardAPI,
        mathJs,
        storageAPI,
        eventAPI,
        uiAPI
      );
      
      // Check that the API was created with all expected properties
      expect(api).toBeDefined();
      expect(api.dashboard).toBeDefined();
      expect(api.mathJs).toBe(mathJs);
      expect(api.storage).toBeDefined();
      expect(api.events).toBeDefined();
      expect(api.ui).toBeDefined();
    });
  });
  
  describe('Dashboard API', () => {
    it('should pass through dashboard API calls', () => {
      // Create a manifest with UI permission
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js',
        permissions: ['ui', 'computation'] // Need UI permission for registerTool/Panel/Visualization
      };
      
      // Create the API
      const api = createPluginAPI(
        manifest,
        dashboardAPI,
        mathJs,
        storageAPI,
        eventAPI,
        uiAPI
      );
      
      // Test registerTool
      const tool = {
        id: 'test-tool',
        name: 'Test Tool',
        icon: 'test-icon',
        component: {}
      };
      api.dashboard.registerTool(tool);
      expect(dashboardAPI.registerTool).toHaveBeenCalledWith(tool);
      
      // Test registerPanel
      const panel = {
        id: 'test-panel',
        component: {}
      };
      api.dashboard.registerPanel(panel);
      expect(dashboardAPI.registerPanel).toHaveBeenCalledWith(panel);
      
      // Test registerVisualization
      const visualization = {
        id: 'test-visualization',
        component: {}
      };
      api.dashboard.registerVisualization(visualization);
      expect(dashboardAPI.registerVisualization).toHaveBeenCalledWith(visualization);
      
      // Test showResult
      const result = { value: 42 };
      api.dashboard.showResult(result);
      expect(dashboardAPI.showResult).toHaveBeenCalledWith(result);
      
      // Test showError
      const error = new Error('Test error');
      api.dashboard.showError(error);
      expect(dashboardAPI.showError).toHaveBeenCalledWith(error);
      
      // Test updateProgressBar
      api.dashboard.updateProgressBar(0.5);
      expect(dashboardAPI.updateProgressBar).toHaveBeenCalledWith(0.5);
    });
  });
  
  describe('Storage API', () => {
    it('should namespace storage API calls', async () => {
      // Create a minimal manifest with storage permission
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js',
        permissions: ['storage']
      };
      
      // Create the API
      const api = createPluginAPI(
        manifest,
        dashboardAPI,
        mathJs,
        storageAPI,
        eventAPI,
        uiAPI
      );
      
      // Test getItem with namespace
      await api.storage.getItem('test-key');
      expect(storageAPI.getItem).toHaveBeenCalledWith('test-plugin:test-key');
      
      // Test setItem with namespace
      await api.storage.setItem('test-key', 'test-value');
      expect(storageAPI.setItem).toHaveBeenCalledWith('test-plugin:test-key', 'test-value');
      
      // Test removeItem with namespace
      await api.storage.removeItem('test-key');
      expect(storageAPI.removeItem).toHaveBeenCalledWith('test-plugin:test-key');
    });
    
    it('should block storage API calls without permission', async () => {
      // Create a minimal manifest without storage permission
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js'
        // No storage permission
      };
      
      // Create the API
      const api = createPluginAPI(
        manifest,
        dashboardAPI,
        mathJs,
        storageAPI,
        eventAPI,
        uiAPI
      );
      
      // All storage API calls should throw an error
      await expect(api.storage.getItem('test-key')).rejects.toThrow('Storage permission not granted');
      await expect(api.storage.setItem('test-key', 'test-value')).rejects.toThrow('Storage permission not granted');
      await expect(api.storage.removeItem('test-key')).rejects.toThrow('Storage permission not granted');
      await expect(api.storage.clear()).rejects.toThrow('Storage permission not granted');
      await expect(api.storage.keys()).rejects.toThrow('Storage permission not granted');
    });
  });
  
  describe('Event API', () => {
    it('should namespace custom events', () => {
      // Create a minimal manifest
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js'
      };
      
      // Create the API
      const api = createPluginAPI(
        manifest,
        dashboardAPI,
        mathJs,
        storageAPI,
        eventAPI,
        uiAPI
      );
      
      // Test publish with custom event - should be namespaced
      api.events.publish('custom-event', { data: 'test' });
      expect(eventAPI.publish).toHaveBeenCalledWith('plugin:test-plugin:custom-event', {
        data: 'test',
        source: 'test-plugin'
      });
      
      // Test publish with dashboard event - should not be namespaced
      api.events.publish('dashboard:event', { data: 'test' });
      expect(eventAPI.publish).toHaveBeenCalledWith('dashboard:event', {
        data: 'test',
        source: 'test-plugin'
      });
    });
    
    it('should wrap event callback to catch errors', () => {
      // Create a minimal manifest
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js'
      };
      
      // Create the API
      const api = createPluginAPI(
        manifest,
        dashboardAPI,
        mathJs,
        storageAPI,
        eventAPI,
        uiAPI
      );
      
      // Mock subscribe to capture the wrapped callback
      let wrappedCallback: ((data: unknown) => void) | null = null;
      (eventAPI.subscribe as jest.Mock).mockImplementation((event: string, callback: (data: unknown) => void) => {
        wrappedCallback = callback;
        return () => {};
      });
      
      // Subscribe to an event
      const callback = vi.fn();
      api.events.subscribe('test-event', callback);
      
      // Check that subscribe was called
      expect(eventAPI.subscribe).toHaveBeenCalled();
      expect(wrappedCallback).not.toBeNull();
      
      // Call the wrapped callback
      if (wrappedCallback) {
        wrappedCallback({ test: 'data' });
        expect(callback).toHaveBeenCalledWith({ test: 'data' });
      }
    });
  });
  
  describe('UI API', () => {
    it('should check permission for notifications', () => {
      // Create a manifest without notification permission
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js'
        // No notifications permission
      };
      
      // Create the API
      const api = createPluginAPI(
        manifest,
        dashboardAPI,
        mathJs,
        storageAPI,
        eventAPI,
        uiAPI
      );
      
      // Mock console.warn
      const originalWarn = console.warn;
      console.warn = vi.fn();
      
      // Try to show a notification
      api.ui.showNotification('Test notification');
      
      // Should not call the UI API
      expect(uiAPI.showNotification).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Notifications permission not granted');
      
      // Restore console.warn
      console.warn = originalWarn;
    });
    
    it('should pass through UI API calls with permission', () => {
      // Create a manifest with notification permission
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js',
        permissions: ['notifications']
      };
      
      // Create the API
      const api = createPluginAPI(
        manifest,
        dashboardAPI,
        mathJs,
        storageAPI,
        eventAPI,
        uiAPI
      );
      
      // Test showNotification
      api.ui.showNotification('Test notification', { type: 'info', duration: 3000 });
      expect(uiAPI.showNotification).toHaveBeenCalledWith('Test notification', { type: 'info', duration: 3000 });
      
      // Test showModal
      api.ui.showModal('Test modal', { content: 'test' });
      expect(uiAPI.showModal).toHaveBeenCalledWith('Test modal', { content: 'test' });
      
      // Test showConfirm
      api.ui.showConfirm('Are you sure?');
      expect(uiAPI.showConfirm).toHaveBeenCalledWith('Are you sure?');
    });
  });
  
  describe('createPermissionCheck', () => {
    it('should create a function that checks permissions', () => {
      // Create a manifest with specific permissions
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: {
          mathJs: '^1.0.0',
          dashboard: '^1.0.0'
        },
        author: {
          name: 'Test Author'
        },
        license: 'MIT',
        description: 'Test plugin for testing',
        entryPoint: './index.js',
        permissions: ['storage', 'computation']
      };
      
      // Create methods to be wrapped
      const method = vi.fn().mockReturnValue('success');
      const fallback = vi.fn().mockReturnValue('fallback');
      
      // Create permission check for a granted permission
      const allowedFn = createPermissionCheck(manifest, method, 'storage', fallback);
      const result1 = allowedFn('arg1', 'arg2');
      
      // Method should be called with args
      expect(method).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result1).toBe('success');
      expect(fallback).not.toHaveBeenCalled();
      
      // Reset mocks
      method.mockClear();
      fallback.mockClear();
      
      // Create permission check for a denied permission
      const deniedFn = createPermissionCheck(manifest, method, 'network', fallback);
      const result2 = deniedFn('arg1', 'arg2');
      
      // Fallback should be called instead
      expect(method).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result2).toBe('fallback');
      
      // Reset mocks
      method.mockClear();
      fallback.mockClear();
      
      // Create permission check for a denied permission without fallback
      const noFallbackFn = createPermissionCheck(manifest, method, 'network');
      
      // Should throw an error
      expect(() => noFallbackFn('arg1', 'arg2')).toThrow('Permission denied: network');
      expect(method).not.toHaveBeenCalled();
    });
  });
});