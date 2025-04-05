# Basic Plugin

A simple plugin template for Math Lab that demonstrates the basic structure and capabilities of a Math Lab plugin.

## Features

- Simple UI panel with input and calculation
- Example methods for basic number calculations
- Demonstration of event handling
- Example of Math-JS integration

## Installation

1. Install the plugin from the Math Lab Plugin Repository:

```
Dashboard > Settings > Plugins > Browse Repository > Basic Plugin > Install
```

2. Or install manually:

```
Dashboard > Settings > Plugins > Install from File > Select basic-plugin-1.0.0.zip
```

## Usage

1. After installation, the Basic Plugin will appear in your sidebar.
2. Click on the Basic Plugin icon to open the main panel.
3. Enter a number in the input field.
4. Click "Calculate Square" to see the result.

## Configuration

This plugin has the following configuration options:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| exampleParameter | Number | 100 | Example configuration parameter |

You can adjust these settings in the plugin configuration panel:

```
Dashboard > Settings > Plugins > Basic Plugin > Configure
```

## API

This plugin exposes the following API for use by other plugins:

- `getVersion()`: Returns the current plugin version
- `performCalculation(value)`: Calculates the square of the input value

Example usage from another plugin:

```javascript
const basicPlugin = dashboard.plugins.get('org.example.basic-plugin');
const version = basicPlugin.api.getVersion();
const result = basicPlugin.api.performCalculation(5); // Returns 25
```

## Development

See the [API documentation](./API.md) for details on the plugin's API.

## License

MIT