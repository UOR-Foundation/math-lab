/**
 * Plugin SDK Testing Utilities Tests
 * 
 * Tests for the plugin testing utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createMockDashboardAPI,
  createMockStorageAPI,
  createMockEventAPI,
  createMockUIAPI,
  createMockPluginAPI,
  PluginTestHarness,
  createPluginTestHarness
} from '../../../../../src/core/plugin-system/sdk/testing';
import { PluginManifest, PluginInstance } from '../../../../../src/core/plugin-system/sdk/types';

describe('Plugin SDK Testing Utilities', () => {
  describe('Mock APIs', () => {
    it('should create a mock dashboard API with all required methods', () => {
      const api = createMockDashboardAPI();
      
      expect(api.registerTool).toBeInstanceOf(Function);
      expect(api.registerPanel).toBeInstanceOf(Function);
      expect(api.registerVisualization).toBeInstanceOf(Function);
      expect(api.showResult).toBeInstanceOf(Function);
      expect(api.showError).toBeInstanceOf(Function);
      expect(api.updateProgressBar).toBeInstanceOf(Function);
    });
    
    it('should create a mock storage API with all required methods', () => {
      const api = createMockStorageAPI();
      
      expect(api.getItem).toBeInstanceOf(Function);
      expect(api.setItem).toBeInstanceOf(Function);
      expect(api.removeItem).toBeInstanceOf(Function);
      expect(api.clear).toBeInstanceOf(Function);
      expect(api.keys).toBeInstanceOf(Function);
    });
    
    it('should create a mock event API with all required methods', () => {
      const api = createMockEventAPI();
      
      expect(api.subscribe).toBeInstanceOf(Function);
      expect(api.publish).toBeInstanceOf(Function);
    });
    
    it('should create a mock UI API with all required methods', () => {
      const api = createMockUIAPI();
      
      expect(api.showNotification).toBeInstanceOf(Function);
      expect(api.showModal).toBeInstanceOf(Function);
      expect(api.showConfirm).toBeInstanceOf(Function);
    });
    
    it('should create a complete mock plugin API', () => {
      const api = createMockPluginAPI();
      
      expect(api.dashboard).toBeDefined();
      expect(api.mathJs).toBeDefined();
      expect(api.storage).toBeDefined();
      expect(api.events).toBeDefined();
      expect(api.ui).toBeDefined();
    });
    
    it('should allow overriding specific parts of the mock API', () => {
      const customDashboard = { 
        registerTool: vi.fn(),
        registerPanel: vi.fn(),
        registerVisualization: vi.fn(),
        showResult: vi.fn(),
        showError: vi.fn(),
        updateProgressBar: vi.fn()
      };
      
      const api = createMockPluginAPI({
        dashboard: customDashboard
      });
      
      expect(api.dashboard).toBe(customDashboard);
    });
  });
  
  describe('PluginTestHarness', () => {
    let manifest: PluginManifest;
    let instance: PluginInstance;
    let harness: PluginTestHarness;
    
    beforeEach(() => {
      // Create a test manifest
      manifest = {
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
        description: 'A test plugin',
        entryPoint: './index.js'
      };
      
      // Create a test instance
      instance = {
        initialize: vi.fn().mockResolvedValue({ success: true }),
        cleanup: vi.fn().mockResolvedValue({ success: true }),
        methods: {
          'test-method': vi.fn().mockReturnValue(42)
        },
        events: {
          'test-event': vi.fn()
        },
        components: {
          panels: {
            'test-panel': () => null
          }
        }
      };
      
      // Create a test harness
      harness = new PluginTestHarness(
        manifest,
        instance
      );
    });
    
    it('should initialize the plugin', async () => {
      const result = await harness.initialize();
      
      expect(instance.initialize).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
    
    it('should pass configuration to initialize', async () => {
      const config = { foo: 'bar' };
      await harness.initialize(config);
      
      expect(instance.initialize).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        config
      );
    });
    
    it('should clean up the plugin', async () => {
      const result = await harness.cleanup();
      
      expect(instance.cleanup).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
    
    it('should call plugin methods', async () => {
      const result = await harness.callMethod('test-method', 1, 2, 3);
      
      expect(instance.methods?.['test-method']).toHaveBeenCalled();
      expect(result).toBe(42);
    });
    
    it('should throw for non-existent methods', async () => {
      await expect(harness.callMethod('non-existent')).rejects.toThrow('Method not found');
    });
    
    it('should trigger event handlers', () => {
      const eventData = { foo: 'bar' };
      harness.triggerEvent('test-event', eventData);
      
      expect(instance.events?.['test-event']).toHaveBeenCalled();
    });
    
    it('should throw for non-existent event handlers', () => {
      expect(() => harness.triggerEvent('non-existent', {})).toThrow('Event handler not found');
    });
    
    it('should get panel components', () => {
      const component = harness.getPanelComponent('test-panel');
      
      expect(component).toBe(instance.components?.panels?.['test-panel']);
    });
    
    it('should return undefined for non-existent panel components', () => {
      const component = harness.getPanelComponent('non-existent');
      
      expect(component).toBeUndefined();
    });
    
    it('should provide access to API mocks', () => {
      const mocks = harness.getMocks();
      
      expect(mocks.dashboard).toBeDefined();
      expect(mocks.storage).toBeDefined();
      expect(mocks.events).toBeDefined();
      expect(mocks.ui).toBeDefined();
    });
  });
  
  describe('createPluginTestHarness', () => {
    it('should create a PluginTestHarness', () => {
      const manifest = {
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
        description: 'A test plugin',
        entryPoint: './index.js'
      };
      
      const instance = {
        initialize: vi.fn().mockResolvedValue({ success: true }),
        cleanup: vi.fn().mockResolvedValue({ success: true })
      };
      
      const harness = createPluginTestHarness(manifest, instance);
      
      expect(harness).toBeInstanceOf(PluginTestHarness);
    });
  });
});