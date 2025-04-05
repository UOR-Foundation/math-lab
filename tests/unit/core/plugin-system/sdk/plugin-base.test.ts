/**
 * Plugin Base Class Tests
 * 
 * Tests for the plugin base class
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginBase } from '../../../../../src/core/plugin-system/sdk/plugin-base';
import { PluginContext, PluginComponent, VisualizationComponent } from '../../../../../src/core/plugin-system/sdk/types';

// Create a test plugin that extends PluginBase
class TestPlugin extends PluginBase {
  constructor() {
    super(
      'test-plugin',
      {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin for testing',
        author: {
          name: 'Test Author'
        },
        license: 'MIT'
      }
    );
  }
  
  async initialize(context: PluginContext): Promise<{ success: boolean; error?: string }> {
    return { success: true, error: undefined };
  }
  
  async cleanup(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

describe('Plugin Base Class', () => {
  let testPlugin: TestPlugin;
  
  beforeEach(() => {
    testPlugin = new TestPlugin();
  });
  
  describe('getManifest', () => {
    it('should return a plugin manifest', () => {
      const manifest = testPlugin.getManifest();
      
      expect(manifest).toBeDefined();
      expect(manifest.id).toBe('test-plugin');
      expect(manifest.name).toBe('Test Plugin');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.author.name).toBe('Test Author');
    });
  });
  
  describe('getInstance', () => {
    it('should return a plugin instance', () => {
      const instance = testPlugin.getInstance();
      
      expect(instance).toBeDefined();
      expect(instance.initialize).toBeInstanceOf(Function);
      expect(instance.cleanup).toBeInstanceOf(Function);
    });
    
    it('should create an instance that calls initialize and cleanup methods', async () => {
      // Spy on the initialize and cleanup methods
      const initializeSpy = vi.spyOn(testPlugin, 'initialize');
      const cleanupSpy = vi.spyOn(testPlugin, 'cleanup');
      
      const instance = testPlugin.getInstance();
      
      // Mock dashboard API
      const dashboard = {};
      
      // Call initialize
      await instance.initialize(dashboard, {}, {});
      
      // Check that initialize was called
      expect(initializeSpy).toHaveBeenCalled();
      
      // Call cleanup
      await instance.cleanup();
      
      // Check that cleanup was called
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
  
  describe('registerPanel', () => {
    it('should register a panel component', () => {
      const testComponent: PluginComponent = () => null;
      
      testPlugin.registerPanel('test-panel', testComponent);
      
      const instance = testPlugin.getInstance();
      expect(instance.components?.panels?.['test-panel']).toBe(testComponent);
    });
  });
  
  describe('registerVisualization', () => {
    it('should register a visualization component', () => {
      const testComponent: VisualizationComponent = () => null;
      
      testPlugin.registerVisualization('test-viz', testComponent);
      
      const instance = testPlugin.getInstance();
      expect(instance.components?.visualizations?.['test-viz']).toBe(testComponent);
    });
  });
  
  describe('registerMethod', () => {
    it('should register a method', () => {
      const testMethod = () => 42;
      
      testPlugin.registerMethod('test-method', testMethod);
      
      const instance = testPlugin.getInstance();
      expect(instance.methods?.['test-method']).toBe(testMethod);
    });
  });
  
  describe('registerEventHandler', () => {
    it('should register an event handler', () => {
      const testHandler = () => { /* noop */ };
      
      testPlugin.registerEventHandler('test-event', testHandler);
      
      const instance = testPlugin.getInstance();
      expect(instance.events?.['test-event']).toBe(testHandler);
    });
  });
});