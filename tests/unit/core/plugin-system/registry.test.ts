import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from '../../../../src/core/plugin-system/registry';
import { PluginManifest } from '../../../../src/core/plugin-system/types';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;
  let sampleManifest: PluginManifest;
  
  beforeEach(() => {
    registry = new PluginRegistry();
    
    // Create a sample manifest for testing
    sampleManifest = {
      id: 'org.example.test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      compatibility: {
        mathJs: '^1.0.0',
        dashboard: '^1.0.0'
      },
      author: {
        name: 'Test Author',
        email: 'author@example.com'
      },
      license: 'MIT',
      description: 'A test plugin',
      entryPoint: './index.js'
    };
  });
  
  it('should register a plugin', () => {
    const entry = registry.register(sampleManifest);
    
    expect(entry.id).toBe(sampleManifest.id);
    expect(entry.manifest).toBe(sampleManifest);
    expect(entry.enabled).toBe(false);
    expect(entry.status).toBe('registered');
  });
  
  it('should throw when registering a duplicate plugin', () => {
    registry.register(sampleManifest);
    
    expect(() => {
      registry.register(sampleManifest);
    }).toThrow(/already registered/);
  });
  
  it('should get a registered plugin', () => {
    registry.register(sampleManifest);
    
    const plugin = registry.getPlugin(sampleManifest.id);
    
    expect(plugin).toBeDefined();
    expect(plugin?.id).toBe(sampleManifest.id);
  });
  
  it('should return undefined for non-existent plugin', () => {
    const plugin = registry.getPlugin('non.existent.plugin');
    
    expect(plugin).toBeUndefined();
  });
  
  it('should enable a plugin', () => {
    registry.register(sampleManifest);
    registry.enablePlugin(sampleManifest.id);
    
    const plugin = registry.getPlugin(sampleManifest.id);
    
    expect(plugin?.enabled).toBe(true);
  });
  
  it('should disable a plugin', () => {
    registry.register(sampleManifest);
    registry.enablePlugin(sampleManifest.id);
    registry.disablePlugin(sampleManifest.id);
    
    const plugin = registry.getPlugin(sampleManifest.id);
    
    expect(plugin?.enabled).toBe(false);
  });
  
  it('should get all plugins', () => {
    registry.register(sampleManifest);
    
    const anotherManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.another-plugin',
      name: 'Another Plugin'
    };
    
    registry.register(anotherManifest);
    
    const plugins = registry.getAllPlugins();
    
    expect(plugins.length).toBe(2);
    expect(plugins[0].id).toBe(sampleManifest.id);
    expect(plugins[1].id).toBe(anotherManifest.id);
  });
  
  it('should get enabled plugins', () => {
    registry.register(sampleManifest);
    
    const anotherManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.another-plugin',
      name: 'Another Plugin'
    };
    
    registry.register(anotherManifest);
    registry.enablePlugin(anotherManifest.id);
    
    const plugins = registry.getEnabledPlugins();
    
    expect(plugins.length).toBe(1);
    expect(plugins[0].id).toBe(anotherManifest.id);
  });
  
  it('should unregister a plugin', () => {
    registry.register(sampleManifest);
    registry.unregisterPlugin(sampleManifest.id);
    
    const plugin = registry.getPlugin(sampleManifest.id);
    
    expect(plugin).toBeUndefined();
  });
  
  it('should manage dependency relationships', () => {
    // Register a dependency plugin
    const dependencyManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.dependency-plugin',
      name: 'Dependency Plugin'
    };
    
    registry.register(dependencyManifest);
    
    // Register a plugin that depends on the first one
    const dependentManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.dependent-plugin',
      name: 'Dependent Plugin',
      dependencies: [
        {
          id: 'org.example.dependency-plugin',
          version: '^1.0.0',
          optional: false
        }
      ]
    };
    
    registry.register(dependentManifest);
    
    // Check if the dependency relationship is established
    const dependency = registry.getPlugin('org.example.dependency-plugin');
    const dependent = registry.getPlugin('org.example.dependent-plugin');
    
    expect(dependency?.dependents).toContain('org.example.dependent-plugin');
    expect(dependent?.dependencies).toContain('org.example.dependency-plugin');
  });
  
  it('should check if dependencies are satisfied', () => {
    // Register a dependency plugin
    const dependencyManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.dependency-plugin',
      name: 'Dependency Plugin'
    };
    
    registry.register(dependencyManifest);
    
    // Enable and initialize the dependency
    registry.enablePlugin('org.example.dependency-plugin');
    registry.updatePlugin(
      'org.example.dependency-plugin',
      { initialize: async () => ({ success: true }) } as unknown as PluginInstance,
      'initialized'
    );
    
    // Register a plugin that depends on the first one
    const dependentManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.dependent-plugin',
      name: 'Dependent Plugin',
      dependencies: [
        {
          id: 'org.example.dependency-plugin',
          version: '^1.0.0',
          optional: false
        }
      ]
    };
    
    registry.register(dependentManifest);
    
    // Check if dependencies are satisfied
    const satisfied = registry.areDependenciesSatisfied('org.example.dependent-plugin');
    
    expect(satisfied).toBe(true);
  });
  
  it('should not allow unregistering a plugin with non-optional dependents', () => {
    // Register a dependency plugin
    const dependencyManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.dependency-plugin',
      name: 'Dependency Plugin'
    };
    
    registry.register(dependencyManifest);
    
    // Register a plugin that depends on the first one
    const dependentManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.dependent-plugin',
      name: 'Dependent Plugin',
      dependencies: [
        {
          id: 'org.example.dependency-plugin',
          version: '^1.0.0',
          optional: false
        }
      ]
    };
    
    registry.register(dependentManifest);
    
    // Attempt to unregister the dependency
    expect(() => {
      registry.unregisterPlugin('org.example.dependency-plugin');
    }).toThrow(/required by/);
  });
  
  it('should allow unregistering a plugin with optional dependents', () => {
    // Register a dependency plugin
    const dependencyManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.dependency-plugin',
      name: 'Dependency Plugin'
    };
    
    registry.register(dependencyManifest);
    
    // Register a plugin that optionally depends on the first one
    const dependentManifest: PluginManifest = {
      ...sampleManifest,
      id: 'org.example.dependent-plugin',
      name: 'Dependent Plugin',
      dependencies: [
        {
          id: 'org.example.dependency-plugin',
          version: '^1.0.0',
          optional: true
        }
      ]
    };
    
    registry.register(dependentManifest);
    
    // Unregister the dependency (should work without error)
    registry.unregisterPlugin('org.example.dependency-plugin');
    
    // Dependency should be gone
    const dependency = registry.getPlugin('org.example.dependency-plugin');
    expect(dependency).toBeUndefined();
    
    // Dependent should still be there
    const dependent = registry.getPlugin('org.example.dependent-plugin');
    expect(dependent).toBeDefined();
  });
});