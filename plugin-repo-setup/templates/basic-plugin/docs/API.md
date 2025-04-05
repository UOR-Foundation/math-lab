# Basic Plugin API Documentation

This document describes the API exposed by the Basic Plugin.

## Plugin API

The Basic Plugin exposes the following APIs for use by other plugins:

### Methods

#### `getVersion()`

Returns the current version of the plugin.

**Returns:** `string` - The version number.

**Example:**
```javascript
const version = basicPlugin.api.getVersion();
console.log(version); // "1.0.0"
```

#### `performCalculation(value)`

Calculates the square of the input value.

**Parameters:**
- `value` (`number`): The number to square.

**Returns:** `number` - The square of the input value.

**Example:**
```javascript
const result = basicPlugin.api.performCalculation(5);
console.log(result); // 25
```

## Internal Methods

The following methods are used internally by the plugin:

### `calculateSquare(value)`

Calculates the square of a number.

**Parameters:**
- `value` (`number`): The number to square.

**Returns:** `number` - The square of the input value.

### `calculateCube(value)`

Calculates the cube of a number.

**Parameters:**
- `value` (`number`): The number to cube.

**Returns:** `number` - The cube of the input value.

### `isEven(value)`

Checks if a number is even.

**Parameters:**
- `value` (`number`): The number to check.

**Returns:** `boolean` - True if the number is even, false otherwise.

### `isOdd(value)`

Checks if a number is odd.

**Parameters:**
- `value` (`number`): The number to check.

**Returns:** `boolean` - True if the number is odd, false otherwise.

## Dashboard API Usage

The Basic Plugin uses the following Dashboard APIs:

### Event Subscription

```javascript
dashboard.events.subscribe('expression:evaluated', (result) => {
  // Handle the event
});
```

### Math-JS Integration

```javascript
const result = await dashboard.mathJs.evaluateExpression(`${value}^2`);
```

### Notifications

```javascript
dashboard.notifications.error('Failed to calculate square');
```

### Documentation

```javascript
dashboard.openDocumentation('basic-plugin');
```

## UI Components

The Basic Plugin provides the following UI components:

### MainPanel

A React component that provides a user interface for entering a number and calculating its square.

**Props:**
- `dashboard` (`object`): The Dashboard API object.