# Plugin Development SDK

This SDK provides tools, utilities, and helpers for developing plugins for the Math Lab dashboard.

## Overview

The Plugin SDK offers a streamlined approach to creating, testing, and distributing plugins for the Math Lab dashboard. It includes:

- Type definitions for plugin development
- Base classes and helper functions
- TypeScript decorators for defining plugin components
- Testing utilities
- Example plugin implementations

## Getting Started

### Creating a Basic Plugin

The easiest way to create a plugin is to extend the `PluginBase` class:

```typescript
import { PluginBase, PluginContext, method, panel } from '@uor-foundation/math-lab/plugin-sdk';

export class MyPlugin extends PluginBase {
  constructor() {
    super(
      'org.example.my-plugin', // Unique plugin ID
      {
        name: 'My First Plugin',
        version: '1.0.0',
        description: 'A simple plugin for Math Lab',
        author: {
          name: 'Your Name',
          email: 'your.email@example.com'
        },
        license: 'MIT',
        permissions: ['storage']
      }
    );
  }
  
  // Plugin initialization
  async initialize(context: PluginContext): Promise<{ success: boolean; error?: string }> {
    // Setup code here
    return { success: true };
  }
  
  // Plugin cleanup
  async cleanup(): Promise<{ success: boolean; error?: string }> {
    // Cleanup code here
    return { success: true };
  }
  
  // Define a method using the @method decorator
  @method('double')
  doubleNumber(context: PluginContext, n: number): number {
    const result = n * 2;
    context.api.dashboard.showResult(result);
    return result;
  }
  
  // Define a panel using the @panel decorator
  @panel('my-panel')
  MyPanel = (props) => {
    // Your React component goes here
    return {
      type: 'div',
      props: {
        children: 'Hello from My Plugin!'
      }
    };
  };
}

// Export plugin creation function
export function createMyPlugin() {
  const plugin = new MyPlugin();
  return {
    manifest: plugin.getManifest(),
    instance: plugin.getInstance()
  };
}
```

### Testing Your Plugin

The SDK includes testing utilities to help you test your plugin:

```typescript
import { createPluginTestHarness } from '@uor-foundation/math-lab/plugin-sdk';
import { MyPlugin } from './my-plugin';

describe('My Plugin', () => {
  let plugin;
  let harness;
  
  beforeEach(() => {
    // Create plugin instance
    plugin = new MyPlugin();
    
    // Create test harness
    harness = createPluginTestHarness(
      plugin.getManifest(),
      plugin.getInstance()
    );
  });
  
  it('should initialize successfully', async () => {
    const result = await harness.initialize();
    expect(result.success).toBe(true);
  });
  
  it('should double numbers correctly', async () => {
    await harness.initialize();
    const result = await harness.callMethod('double', 21);
    expect(result).toBe(42);
  });
});
```

## SDK Components

### Core Classes

- `PluginBase`: Abstract base class for creating plugins
- `PluginTestHarness`: Test harness for testing plugins

### Decorators

- `@method(id)`: Register a plugin method
- `@eventHandler(eventName)`: Register an event handler
- `@panel(id)`: Register a panel component
- `@visualization(id)`: Register a visualization component

### Helper Functions

- `createManifest()`: Create a plugin manifest
- `createPluginInstance()`: Create a plugin instance
- `createPlugin()`: Create a complete plugin package

### Testing Utilities

- `createMockDashboardAPI()`: Create a mock dashboard API
- `createMockStorageAPI()`: Create a mock storage API
- `createMockEventAPI()`: Create a mock event API
- `createMockUIAPI()`: Create a mock UI API
- `createMockPluginAPI()`: Create a complete mock plugin API
- `createPluginTestHarness()`: Create a plugin test harness

## Examples

The SDK includes example plugin implementations:

- `BasicExamplePlugin`: A simple plugin demonstrating core functionality
- `NumberTheoryPlugin`: A more complex plugin with multiple components

## Plugin Manifest

The plugin manifest defines the metadata and capabilities of your plugin:

```typescript
interface PluginManifest {
  id: string;                  // Unique plugin identifier
  name: string;                // Display name
  version: string;             // Semantic version
  compatibility: {             // Version compatibility
    mathJs: string;
    dashboard: string;
  };
  author: {                    // Author information
    name: string;
    email?: string;
    url?: string;
  };
  license: string;             // License identifier
  description: string;         // Plugin description
  keywords?: string[];         // Search keywords
  repository?: string;         // Source code repository
  entryPoint: string;          // Main entry point
  dependencies?: PluginDependency[]; // Plugin dependencies
  dashboard?: {                // Dashboard integration
    panels?: PanelDefinition[];
    toolbarItems?: ToolbarItemDefinition[];
    visualizations?: VisualizationDefinition[];
    menu?: MenuItemDefinition[];
  };
  config?: {                   // Plugin configuration
    schema: Record<string, PluginConfigParameter>;
  };
  permissions?: PluginPermission[]; // Required permissions
  resources?: {                // Resource requirements
    cpu?: 'low' | 'medium' | 'high';
    memory?: 'low' | 'medium' | 'high';
  };
  documentation?: {            // Documentation links
    main?: string;
    api?: string;
  };
}
```

## Plugin Permissions

Plugins can request the following permissions:

- `storage`: Access to plugin storage
- `storage.local`: Access to local storage only
- `storage.cloud`: Access to cloud storage
- `computation`: Basic computation capabilities
- `computation.intensive`: Intensive computation capabilities
- `network`: Network access
- `clipboard`: Clipboard access
- `notifications`: Show notifications

## Plugin API

Plugins have access to the following APIs:

- `dashboard`: Interact with dashboard components and state
- `mathJs`: Access math-js library functionality
- `storage`: Persist plugin data
- `events`: Subscribe to and publish events
- `ui`: Create and manipulate UI elements

## Packaging and Distribution

Plugins can be distributed in the following formats:

1. **npm Package**: Published to npm registry with the naming convention `@org/math-js-plugin-name`
2. **Web Bundle**: A single-file bundle in UMD format
3. **Dashboard Package**: ZIP file containing all plugin files with a signature file