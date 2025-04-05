/**
 * Web Worker entry point for Math Lab computation
 * 
 * This file serves as the entry point for the web worker,
 * importing the actual implementation from the core module.
 * It handles initialization, resource monitoring, and error recovery.
 */

// Import the worker implementation
import '../core/computation/computation-worker.ts';

// Setup resource monitoring
let memoryInterval;
const MEMORY_CHECK_INTERVAL = 1000; // Check memory usage every second

// Monitor memory usage if possible (not available in all browsers)
if (self.performance && self.performance.memory) {
  memoryInterval = setInterval(() => {
    const memoryInfo = self.performance.memory;
    
    self.postMessage({
      type: 'resource',
      resource: {
        memory: {
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
        }
      }
    });
    
    // If memory usage is close to limit, post a warning
    if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.9) {
      self.postMessage({
        type: 'warning',
        warning: 'Memory usage high'
      });
    }
  }, MEMORY_CHECK_INTERVAL);
}

// Send initialization complete message
self.postMessage({ 
  type: 'init', 
  status: 'ready',
  capabilities: {
    hasMemoryMonitoring: !!(self.performance && self.performance.memory)
  }
});