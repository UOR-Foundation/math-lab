/**
 * Plugin SDK Helpers Tests
 * 
 * Tests for the plugin SDK helper functions
 */

import { describe, it, expect } from 'vitest';
import { 
  createManifest,
  createPluginInstance,
  createPlugin
} from '../../../../../src/core/plugin-system/sdk/helpers';
import { PluginMetadata } from '../../../../../src/core/plugin-system/sdk/types';

describe('Plugin SDK Helpers', () => {
  // Sample plugin metadata for testing
  const sampleMetadata: PluginMetadata = {
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: {
      name: 'Test Author',
      email: 'test@example.com'
    },
    license: 'MIT',
    keywords: ['test', 'plugin'],
    permissions: ['storage']
  };
  
  describe('createManifest', () => {
    it('should create a plugin manifest with provided metadata', () => {
      const manifest = createManifest('test-plugin', sampleMetadata);
      
      expect(manifest).toMatchObject({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: {
          name: 'Test Author',
          email: 'test@example.com'
        },
        license: 'MIT',
        keywords: ['test', 'plugin'],
        permissions: ['storage'],
        entryPoint: './index.js'
      });
    });
    
    it('should use provided compatibility', () => {
      const manifest = createManifest(
        'test-plugin', 
        sampleMetadata, 
        { mathJs: '~2.0.0', dashboard: '~2.0.0' }
      );
      
      expect(manifest.compatibility).toEqual({
        mathJs: '~2.0.0',
        dashboard: '~2.0.0'
      });
    });
    
    it('should use default compatibility if not provided', () => {
      const manifest = createManifest('test-plugin', sampleMetadata);
      
      expect(manifest.compatibility).toEqual({
        mathJs: '^1.0.0',
        dashboard: '^1.0.0'
      });
    });
  });
  
  describe('createPluginInstance', () => {
    it('should create a plugin instance with initialize and cleanup functions', () => {
      const instance = createPluginInstance(sampleMetadata);
      
      expect(instance.initialize).toBeInstanceOf(Function);
      expect(instance.cleanup).toBeInstanceOf(Function);
    });
    
    it('should include components from metadata', () => {
      const testPanel = () => ({ type: 'div' });
      const metadataWithComponents: PluginMetadata = {
        ...sampleMetadata,
        components: {
          panels: {
            'test-panel': testPanel
          }
        }
      };
      
      const instance = createPluginInstance(metadataWithComponents);
      
      expect(instance.components).toBeDefined();
      expect(instance.components?.panels?.['test-panel']).toBe(testPanel);
    });
    
    it('should include methods from metadata', () => {
      const testMethod = () => 42;
      const metadataWithMethods: PluginMetadata = {
        ...sampleMetadata,
        methods: {
          'test-method': testMethod
        }
      };
      
      const instance = createPluginInstance(metadataWithMethods);
      
      expect(instance.methods).toBeDefined();
      expect(instance.methods?.['test-method']).toBe(testMethod);
    });
    
    it('should include event handlers from metadata', () => {
      const testHandler = () => { /* noop */ };
      const metadataWithEvents: PluginMetadata = {
        ...sampleMetadata,
        events: {
          'test-event': testHandler
        }
      };
      
      const instance = createPluginInstance(metadataWithEvents);
      
      expect(instance.events).toBeDefined();
      expect(instance.events?.['test-event']).toBe(testHandler);
    });
  });
  
  describe('createPlugin', () => {
    it('should create a complete plugin with manifest and instance', () => {
      const plugin = createPlugin('test-plugin', sampleMetadata);
      
      expect(plugin.manifest).toBeDefined();
      expect(plugin.instance).toBeDefined();
      expect(plugin.manifest.id).toBe('test-plugin');
      expect(plugin.manifest.name).toBe('Test Plugin');
    });
    
    it('should pass compatibility to manifest creation', () => {
      const compatibility = { mathJs: '~2.0.0', dashboard: '~2.0.0' };
      const plugin = createPlugin('test-plugin', sampleMetadata, compatibility);
      
      expect(plugin.manifest.compatibility).toEqual(compatibility);
    });
  });
});