/**
 * Plugin Decorators
 * 
 * TypeScript decorators for plugin development
 */

import { PluginBase } from './plugin-base';
import { PluginMethod, PluginEventHandler, PluginComponent, VisualizationComponent } from './types';

/**
 * Method decorator for registering a plugin method
 * 
 * @param methodId Method identifier
 * @returns Method decorator
 */
export function method(methodId: string) {
  return function(target: PluginBase, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store original method
    const originalMethod = descriptor.value;
    
    // Register the method with the plugin
    target.registerMethod(methodId, originalMethod);
    
    // Return the original method
    return descriptor;
  };
}

/**
 * Event handler decorator for registering a plugin event handler
 * 
 * @param eventName Event name to handle
 * @returns Event handler decorator
 */
export function eventHandler(eventName: string) {
  return function(target: PluginBase, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store original method
    const originalMethod = descriptor.value;
    
    // Register the event handler with the plugin
    target.registerEventHandler(eventName, originalMethod);
    
    // Return the original method
    return descriptor;
  };
}

/**
 * Panel decorator for registering a panel component
 * 
 * @param panelId Panel identifier
 * @returns Property decorator
 */
export function panel(panelId: string) {
  return function(target: PluginBase, propertyKey: string) {
    // Get the component from the property
    const component = target[propertyKey] as PluginComponent;
    
    // Register the panel with the plugin
    target.registerPanel(panelId, component);
  };
}

/**
 * Visualization decorator for registering a visualization component
 * 
 * @param visualizationId Visualization identifier
 * @returns Property decorator
 */
export function visualization(visualizationId: string) {
  return function(target: PluginBase, propertyKey: string) {
    // Get the component from the property
    const component = target[propertyKey] as VisualizationComponent;
    
    // Register the visualization with the plugin
    target.registerVisualization(visualizationId, component);
  };
}
