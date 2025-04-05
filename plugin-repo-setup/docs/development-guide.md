# Plugin Development Guide

This guide provides instructions for developing plugins for the Math Lab application.

## Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- TypeScript 5.x or later
- Familiarity with React

## Getting Started

1. **Install the Math Lab Plugin SDK**:

```bash
npm install @uor-foundation/math-lab-plugin-sdk
```

2. **Use a template**:

Clone one of the template repositories or use the template in this repository:

```bash
# Copy a template
cp -r templates/basic-plugin my-plugin
cd my-plugin
npm install
```

## Plugin Structure

Each plugin must follow this file structure:

```
math-js-plugin-[name]/
├── manifest.json       # Plugin metadata and configuration
├── index.js            # Main entry point
├── components/         # UI components
│   └── *.jsx           # React components
├── methods/            # Mathematical methods
│   └── *.js            # Core functionality
├── assets/             # Static assets
│   ├── images/         # Icons, diagrams, etc.
│   └── styles/         # CSS/SCSS files
├── docs/               # Documentation
│   ├── README.md       # Usage instructions
│   └── API.md          # API documentation
├── examples/           # Example usage
│   └── *.js            # Example code
├── tests/              # Test suite
│   └── *.test.js       # Test files
└── package.json        # npm package info
```

## Manifest File

Each plugin must include a `manifest.json` file with the following structure:

```json
{
  "id": "org.example.plugin-name",
  "name": "Plugin Display Name",
  "version": "1.0.0",
  "compatibility": {
    "mathJs": "^1.0.0",
    "dashboard": "^1.0.0"
  },
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://example.com"
  },
  "license": "MIT",
  "description": "Brief description of plugin functionality",
  "keywords": ["math", "number-theory", "visualization"],
  "repository": "https://github.com/author/math-js-plugin",
  "entryPoint": "./index.js",
  "dependencies": [
    {
      "id": "org.example.other-plugin",
      "version": "^1.0.0",
      "optional": false
    }
  ],
  "dashboard": {
    "panels": [
      {
        "id": "main-panel",
        "title": "Panel Title",
        "icon": "./assets/images/icon.svg",
        "position": "main",
        "initialState": {
          "expanded": true,
          "width": "50%"
        }
      }
    ],
    "toolbarItems": [],
    "visualizations": [],
    "menu": []
  },
  "config": {
    "schema": {
      "parameter1": {
        "type": "number",
        "default": 100,
        "description": "Description of parameter",
        "min": 1,
        "max": 1000
      }
    }
  },
  "permissions": [
    "storage",
    "computation.intensive"
  ],
  "resources": {
    "cpu": "medium",
    "memory": "high"
  },
  "documentation": {
    "main": "./docs/README.md",
    "api": "./docs/API.md"
  }
}
```

## Plugin Entry Point

The plugin entry point (`index.js`) must export an object with the following structure:

```javascript
export default {
  // Plugin initialization function
  initialize: async (dashboard, mathJs, config) => {
    // Setup code runs when plugin is loaded
    return { success: true };
  },
  
  // Plugin cleanup function
  cleanup: async () => {
    // Cleanup code runs when plugin is unloaded
    return { success: true };
  },
  
  // UI Components exposed to dashboard
  components: {
    panels: {
      'main-panel': MainPanelComponent
    }
  },
  
  // Methods that extend math-js functionality
  methods: {
    method1: (arg1, arg2) => {
      // Implementation
      return result;
    }
  },
  
  // Event listeners
  events: {
    'dashboard:computation-complete': (event) => {
      // Handle dashboard events
    }
  },
  
  // Public API for other plugins
  api: {
    exportedFunction: (params) => {
      // Implementation
    }
  }
};
```

## Plugin API

The dashboard exposes the following API to plugins:

- **Dashboard API**: Interface with dashboard components and state
- **Math-JS API**: Direct access to math-js library functionality
- **UI API**: Create and manipulate UI elements
- **Storage API**: Persist plugin data
- **Event API**: Subscribe to and emit events
- **Visualization API**: Render graphical elements

Example API usage:

```javascript
// Register a tool
dashboard.registerTool({
  id: 'prime-factorization',
  name: 'Prime Factorization',
  icon: './assets/factorization-icon.svg',
  component: FactorizationTool
});

// Subscribe to events
dashboard.events.subscribe('expression:evaluated', (result) => {
  // React to expression evaluation
});

// Store plugin data
dashboard.storage.setItem('plugin-data', data);
```

## Testing Your Plugin

The Math Lab Plugin SDK includes a test harness for testing plugins:

```javascript
import { createPluginTestHarness } from '@uor-foundation/math-lab-plugin-sdk/testing';

describe('My Plugin', () => {
  let harness;
  
  beforeEach(() => {
    harness = createPluginTestHarness('./index.js');
  });
  
  it('should initialize successfully', async () => {
    const result = await harness.initialize();
    expect(result.success).toBe(true);
  });
  
  it('should perform calculation correctly', async () => {
    await harness.initialize();
    const result = await harness.callMethod('calculateFactorial', 5);
    expect(result.toString()).toBe('120');
  });
});
```

## Distribution

Plugins must be distributable in the following formats:

1. **npm Package**:
   - Published to npm registry with the naming convention `@org/math-lab-plugin-name`
   - Proper semver versioning

2. **Web Bundled Format**:
   - A single-file bundle (using tools like Webpack, Rollup, etc.)
   - Filename: `math-js-plugin-[name]-[version].js`
   - UMD format for universal compatibility

3. **Dashboard Installable Package**:
   - ZIP file containing all plugin files
   - Naming convention: `math-js-plugin-[name]-[version].zip`
   - Digital signature file included (`signature.asc`) for security

## Submission Guidelines

### Code Quality

- Use TypeScript for type safety
- Follow ESLint rules from Math Lab
- Provide comprehensive JSDoc comments
- Maintain test coverage above 80%

### Security Considerations

- Do not include sensitive information in plugin code
- Use the provided security sandbox
- Request only necessary permissions
- Handle user input securely

### Performance

- Optimize computation-heavy operations
- Use web workers for intensive calculations
- Implement proper cleanup in the `cleanup` method
- Be mindful of memory usage

## Best Practices

1. **Single Responsibility**: Each plugin should focus on a specific functionality
2. **Progressive Enhancement**: Provide basic functionality that works everywhere, with enhanced features where supported
3. **Accessibility**: Follow WCAG 2.1 AA guidelines
4. **Internationalization**: Support multiple languages where appropriate
5. **Documentation**: Provide clear, comprehensive documentation

## Examples

See the `examples/` directory for complete plugin examples:

- Basic Plugin Example
- Visualization Plugin Example
- Number Theory Plugin Example

## Support

For questions or issues related to plugin development:

- Open an issue in the GitHub repository
- Join the discussion in the Math Lab community forums
- Check the FAQ in the documentation