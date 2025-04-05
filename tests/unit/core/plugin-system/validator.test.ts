import { describe, it, expect } from 'vitest';
import { validateManifest } from '../../../../src/core/plugin-system/validator';
import { PluginManifest } from '../../../../src/core/plugin-system/types';

describe('Manifest Validator', () => {
  // Create a valid manifest for testing
  const validManifest: PluginManifest = {
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
  
  it('should validate a valid manifest', () => {
    // This should not throw an error
    expect(() => {
      validateManifest(validManifest);
    }).not.toThrow();
  });
  
  it('should reject a manifest missing required fields', () => {
    const invalidManifest = { ...validManifest };
    delete (invalidManifest as any).name;
    
    expect(() => {
      validateManifest(invalidManifest as PluginManifest);
    }).toThrow(/Missing required field/);
  });
  
  it('should reject a manifest with invalid ID format', () => {
    const invalidManifest = { 
      ...validManifest,
      id: 'invalid-id'  // Not in reverse domain format
    };
    
    expect(() => {
      validateManifest(invalidManifest);
    }).toThrow(/Invalid plugin ID format/);
  });
  
  it('should reject a manifest with invalid version format', () => {
    const invalidManifest = { 
      ...validManifest,
      version: 'v1'  // Not semver compliant
    };
    
    expect(() => {
      validateManifest(invalidManifest);
    }).toThrow(/Invalid version format/);
  });
  
  it('should validate complex manifests with UI components', () => {
    const complexManifest: PluginManifest = {
      ...validManifest,
      dashboard: {
        panels: [
          {
            id: 'main-panel',
            title: 'Main Panel',
            position: 'main',
            initialState: {
              expanded: true
            }
          }
        ],
        toolbarItems: [
          {
            id: 'toolbar-button',
            title: 'Toolbar Button',
            icon: './assets/toolbar-icon.svg',
            action: 'showPanel'
          }
        ],
        visualizations: [
          {
            id: 'chart-vis',
            name: 'Chart Visualization',
            type: 'chart',
            supportsData: ['series', 'points']
          }
        ]
      },
      permissions: ['storage', 'computation'],
      resources: {
        cpu: 'medium',
        memory: 'low'
      }
    };
    
    // This should not throw an error
    expect(() => {
      validateManifest(complexManifest);
    }).not.toThrow();
  });
  
  it('should reject manifests with invalid panel positions', () => {
    const invalidManifest: PluginManifest = {
      ...validManifest,
      dashboard: {
        panels: [
          {
            id: 'main-panel',
            title: 'Main Panel',
            position: 'invalid-position' as any,
          }
        ]
      }
    };
    
    expect(() => {
      validateManifest(invalidManifest);
    }).toThrow(/Invalid position/);
  });
  
  it('should reject manifests with invalid visualization types', () => {
    const invalidManifest: PluginManifest = {
      ...validManifest,
      dashboard: {
        visualizations: [
          {
            id: 'invalid-vis',
            name: 'Invalid Visualization',
            type: 'invalid-type' as any,
            supportsData: ['series']
          }
        ]
      }
    };
    
    expect(() => {
      validateManifest(invalidManifest);
    }).toThrow(/Invalid type/);
  });
  
  it('should reject manifests with invalid permissions', () => {
    const invalidManifest: PluginManifest = {
      ...validManifest,
      permissions: ['storage', 'invalid-permission' as any]
    };
    
    expect(() => {
      validateManifest(invalidManifest);
    }).toThrow(/Invalid permission/);
  });
  
  it('should reject manifests with invalid resource levels', () => {
    const invalidManifest: PluginManifest = {
      ...validManifest,
      resources: {
        cpu: 'extreme' as any
      }
    };
    
    expect(() => {
      validateManifest(invalidManifest);
    }).toThrow(/Invalid CPU resource level/);
  });
  
  it('should validate manifests with dependencies', () => {
    const manifestWithDeps: PluginManifest = {
      ...validManifest,
      dependencies: [
        {
          id: 'org.example.dependency',
          version: '^1.0.0',
          optional: false
        },
        {
          id: 'org.example.optional-dependency',
          version: '^2.0.0',
          optional: true
        }
      ]
    };
    
    // This should not throw an error
    expect(() => {
      validateManifest(manifestWithDeps);
    }).not.toThrow();
  });
  
  it('should reject manifests with invalid dependency version format', () => {
    const invalidManifest: PluginManifest = {
      ...validManifest,
      dependencies: [
        {
          id: 'org.example.dependency',
          version: 'latest?', // Invalid semver range
          optional: false
        }
      ]
    };
    
    expect(() => {
      validateManifest(invalidManifest);
    }).toThrow(/Invalid semver range/);
  });
});