/**
 * Plugin Decorators Tests
 * 
 * Tests for the plugin decorators
 */

import { describe, it, expect, vi } from 'vitest';
import { method, eventHandler, panel, visualization } from '../../../../../src/core/plugin-system/sdk/decorators';
import { PluginBase } from '../../../../../src/core/plugin-system/sdk/plugin-base';

// Create a test plugin class for testing decorators
class TestPluginClass extends PluginBase {
  constructor() {
    super(
      'test-plugin',
      {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin for testing decorators',
        author: {
          name: 'Test Author'
        },
        license: 'MIT'
      }
    );
  }
  
  @method('test-method')
  testMethod() {
    return 42;
  }
  
  @eventHandler('test-event')
  testEventHandler() {
    // Event handler implementation
  }
  
  @panel('test-panel')
  testPanel = () => null;
  
  @visualization('test-viz')
  testVisualization = () => null;
}

describe('Plugin Decorators', () => {
  let testPlugin: TestPluginClass;
  
  beforeEach(() => {
    testPlugin = new TestPluginClass();
  });
  
  describe('@method decorator', () => {
    it('should register a method with the plugin', () => {
      const instance = testPlugin.getInstance();
      
      expect(instance.methods).toBeDefined();
      expect(instance.methods?.['test-method']).toBeDefined();
    });
    
    it('should preserve the original method functionality', () => {
      expect(testPlugin.testMethod()).toBe(42);
    });
  });
  
  describe('@eventHandler decorator', () => {
    it('should register an event handler with the plugin', () => {
      const instance = testPlugin.getInstance();
      
      expect(instance.events).toBeDefined();
      expect(instance.events?.['test-event']).toBeDefined();
    });
  });
  
  describe('@panel decorator', () => {
    it('should register a panel component with the plugin', () => {
      const instance = testPlugin.getInstance();
      
      expect(instance.components).toBeDefined();
      expect(instance.components?.panels).toBeDefined();
      expect(instance.components?.panels?.['test-panel']).toBeDefined();
    });
  });
  
  describe('@visualization decorator', () => {
    it('should register a visualization component with the plugin', () => {
      const instance = testPlugin.getInstance();
      
      expect(instance.components).toBeDefined();
      expect(instance.components?.visualizations).toBeDefined();
      expect(instance.components?.visualizations?.['test-viz']).toBeDefined();
    });
  });
});