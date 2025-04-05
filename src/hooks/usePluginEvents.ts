/**
 * Hook for using plugin events in React components
 */

import { useEffect, useRef, useCallback } from 'react';
import { getPluginApiService } from '../core/plugin-system/service';

/**
 * Hook for subscribing to plugin events
 * 
 * @param eventName Event name to subscribe to
 * @param callback Callback function to invoke when event is published
 */
export function usePluginEvent(
  eventName: string,
  callback: (data: unknown) => void
): void {
  const eventApi = getPluginApiService().getEventApi();
  
  // Use a ref to hold the most recent callback to avoid subscription recreation
  const callbackRef = useRef(callback);
  
  // Update the ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Subscribe to the event
  useEffect(() => {
    // Create a stable callback that uses the ref
    const stableCallback = (data: unknown) => {
      callbackRef.current(data);
    };
    
    // Subscribe and get unsubscribe function
    const unsubscribe = eventApi.subscribe(eventName, stableCallback);
    
    // Unsubscribe when component unmounts or eventName changes
    return () => {
      unsubscribe();
    };
  }, [eventName, eventApi]);
}

/**
 * Hook for publishing plugin events
 * 
 * @returns Function to publish events
 */
export function usePluginEventPublisher() {
  const eventApi = getPluginApiService().getEventApi();
  
  /**
   * Publish an event
   * 
   * @param eventName Event name to publish
   * @param data Data to pass to subscribers
   */
  const publishEvent = useCallback(
    (eventName: string, data: unknown) => {
      eventApi.publish(eventName, data);
    },
    [eventApi]
  );
  
  return publishEvent;
}
