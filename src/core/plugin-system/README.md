# Plugin System

The plugin system provides a framework for extending the Math Lab dashboard with additional functionality. It allows for dynamically loading, registering, and managing plugins that can add new panels, visualizations, tools, and methods to the dashboard.

## Architecture

The plugin system consists of several key components:

1. **Types** - Type definitions for the plugin system
2. **Registry** - Tracks registered plugins and their dependencies
3. **Loader** - Loads plugin code and creates instances
4. **Manager** - Manages the lifecycle of plugins
5. **API** - Provides interfaces for plugins to interact with the dashboard
6. **Sandbox** - Creates a secure environment for running plugin code
7. **Validator** - Validates plugin manifests

## Plugin Lifecycle

Plugins go through the following lifecycle:

1. **Registration** - Plugin manifest is registered with the system
2. **Loading** - Plugin code is loaded and instantiated
3. **Initialization** - Plugin is initialized with dashboard APIs
4. **Enabling/Disabling** - Plugin can be enabled or disabled during runtime
5. **Unloading** - Plugin is cleaned up and removed

## Plugin Manifest

Each plugin must include a manifest that defines its metadata and capabilities. The manifest format is defined in the `types.ts` file and includes:

- Basic information (ID, name, version, etc.)
- Compatibility requirements
- Dependencies
- UI components (panels, toolbar items, etc.)
- Configuration schema
- Required permissions

## Plugin API

Plugins have access to the following APIs:

- **Dashboard API** - For interacting with the dashboard UI
- **Math-JS API** - For accessing the math-js library
- **Storage API** - For persisting plugin data
- **Event API** - For subscribing to and publishing events
- **UI API** - For showing notifications, modals, etc.

## Security

The plugin system includes several security features:

- **Manifest Validation** - Ensures plugins declare required information
- **Dependency Resolution** - Manages plugin dependencies correctly
- **Permission System** - Restricts access to sensitive operations
- **Sandboxed Execution** - Isolates plugin code for security

## Usage

Example of registering and loading a plugin:

```typescript
import { createPluginManager } from '@/core/plugin-system';

// Create the plugin manager
const pluginManager = createPluginManager(
  dashboardAPI,
  mathJsInstance,
  storageAPI,
  eventsAPI,
  uiAPI
);

// Register a plugin
const pluginId = await pluginManager.registerPlugin(manifest);

// Load and initialize the plugin
await pluginManager.loadPlugin(pluginId);

// Enable the plugin
pluginManager.enablePlugin(pluginId);
```

## Plugin Development

To create a plugin, developers need to:

1. Create a manifest file defining the plugin
2. Implement the plugin interface
3. Package the plugin for distribution

See the plugin development guide for more detailed information.