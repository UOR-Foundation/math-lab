/**
 * Event API Implementation
 * 
 * Provides the concrete implementation of the PluginEventAPI interface
 * for use with the plugin system.
 */

import { PluginEventAPI } from '../types';

/**
 * Event bus for communication between plugins and the dashboard
 */
class EventBus {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  /**
   * Subscribe to an event
   * 
   * @param eventName Name of the event to listen for
   * @param callback Callback function to invoke when the event is published
   * @returns Function to unsubscribe from the event
   */
  subscribe(eventName: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const eventListeners = this.listeners.get(eventName)!;
    eventListeners.add(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners.has(eventName)) {
        const listeners = this.listeners.get(eventName)!;
        listeners.delete(callback);

        // Clean up empty listener sets
        if (listeners.size === 0) {
          this.listeners.delete(eventName);
        }
      }
    };
  }

  /**
   * Publish an event
   * 
   * @param eventName Name of the event to publish
   * @param data Data to pass to subscribers
   */
  publish(eventName: string, data: unknown): void {
    if (!this.listeners.has(eventName)) {
      return; // No listeners for this event
    }

    const eventListeners = this.listeners.get(eventName)!;
    
    // Execute each listener, catching errors to prevent one handler from
    // breaking others
    for (const listener of eventListeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for "${eventName}":`, error);
      }
    }
  }

  /**
   * Get all registered event names
   * 
   * @returns Array of event names
   */
  getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Create singleton instance
const eventBus = new EventBus();

/**
 * Creates an event API implementation that uses the event bus
 * for communication between plugins and the dashboard.
 * 
 * @returns Event API implementation
 */
export function createEventApiImpl(): PluginEventAPI {
  return {
    subscribe: (eventName, callback) => {
      return eventBus.subscribe(eventName, callback);
    },

    publish: (eventName, data) => {
      eventBus.publish(eventName, data);
    }
  };
}

// Export the singleton for direct use
export { eventBus };
