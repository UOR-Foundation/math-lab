import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSandbox, hasPermission, getResourceLimits } from '../../../../src/core/plugin-system/sandbox';
import { PluginManifest } from '../../../../src/core/plugin-system/types';

// Event types for our mock
interface MockEvent {
  data: unknown;
}

// Mock the Worker API
class MockWorker {
  onmessage: ((event: MockEvent) => void) | null = null;
  listeners: Record<string, Array<(event: MockEvent) => void>> = {
    message: [],
    error: []
  };
  
  constructor(public url: string | URL) {}
  
  postMessage(data: unknown): void {
    // Simulate successful loading response
    setTimeout(() => {
      this.dispatchEvent('message', {
        data: {
          type: (data as Record<string, string>).type === 'load' ? 'loaded' : 'initialized',
          id: (data as Record<string, string>).id,
          payload: { success: true }
        }
      });
    }, 10);
  }
  
  addEventListener(type: string, callback: (event: MockEvent) => void): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }
  
  removeEventListener(type: string, callback: (event: MockEvent) => void): void {
    if (!this.listeners[type]) return;
    const index = this.listeners[type].indexOf(callback);
    if (index !== -1) {
      this.listeners[type].splice(index, 1);
    }
  }
  
  dispatchEvent(type: string, event: MockEvent): void {
    if (type === 'message' && this.onmessage) {
      this.onmessage(event);
    }
    
    if (!this.listeners[type]) return;
    for (const callback of this.listeners[type]) {
      callback(event);
    }
  }
  
  terminate(): void {
    // Cleanup
    this.listeners = { message: [], error: [] };
    this.onmessage = null;
  }
}

// Mock the URL API
global.URL = vi.fn((url: string) => ({ toString: () => url })) as unknown as typeof URL;

// We won't mock the hasPermission function, we'll use the real one

// Mock worker
vi.stubGlobal('Worker', MockWorker);

describe('Plugin Sandbox', () => {
  const sampleManifest: PluginManifest = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    compatibility: {
      mathJs: '^1.0.0',
      dashboard: '^1.0.0'
    },
    author: {
      name: 'Test Author'
    },
    license: 'MIT',
    description: 'Test plugin for unit tests',
    entryPoint: './index.js',
    permissions: ['storage.local', 'computation']
  };
  
  const sampleCode = `
    module.exports = {
      initialize: async (dashboard, mathJs, config) => {
        return { success: true };
      },
      cleanup: async () => {
        return { success: true };
      },
      methods: {
        testMethod: (arg1, arg2) => {
          return arg1 + arg2;
        }
      }
    };
  `;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Clean up any workers that might still be active
    const workers = (global as Record<string, unknown>).Worker?.instances as MockWorker[] || [];
    for (const worker of workers) {
      worker.terminate();
    }
  });
  
  it('should create a sandboxed plugin instance', () => {
    const instance = createSandbox(sampleManifest, sampleCode);
    
    expect(instance).toBeDefined();
    expect(typeof instance.initialize).toBe('function');
    expect(typeof instance.cleanup).toBe('function');
  });
  
  it('should check permissions correctly', () => {
    // Test direct permission
    expect(hasPermission(sampleManifest, 'storage.local')).toBe(true);
    
    // Test parent permission - computation is directly granted
    expect(hasPermission(sampleManifest, 'computation')).toBe(true);
    
    // Add computation.intensive to the manifest to test
    const manifestWithIntensive = {
      ...sampleManifest,
      permissions: [...sampleManifest.permissions, 'computation.intensive']
    };
    
    // With computation.intensive explicitly granted
    expect(hasPermission(manifestWithIntensive, 'computation.intensive')).toBe(true);
    
    // With only computation granted, intensive should NOT be granted
    expect(hasPermission(sampleManifest, 'computation.intensive')).toBe(false);
    
    // Test missing permission
    expect(hasPermission(sampleManifest, 'network')).toBe(false);
    
    // Test with no permissions
    const noPermissionsManifest = { ...sampleManifest, permissions: undefined };
    expect(hasPermission(noPermissionsManifest, 'storage')).toBe(false);
  });
  
  it('should calculate resource limits based on manifest', () => {
    // Test default limits
    const limits = getResourceLimits(sampleManifest);
    expect(limits.cpuLimit).toBe(100); // Default CPU limit
    expect(limits.memoryLimit).toBe(10 * 1024 * 1024); // Default memory limit (10MB)
    
    // Test low resource limits
    const lowResManifest = {
      ...sampleManifest,
      resources: {
        cpu: 'low',
        memory: 'low'
      }
    };
    const lowLimits = getResourceLimits(lowResManifest);
    expect(lowLimits.cpuLimit).toBe(50); // Low CPU limit
    expect(lowLimits.memoryLimit).toBe(5 * 1024 * 1024); // Low memory limit (5MB)
    
    // Test high resource limits
    const highResManifest = {
      ...sampleManifest,
      resources: {
        cpu: 'high',
        memory: 'high'
      }
    };
    const highLimits = getResourceLimits(highResManifest);
    expect(highLimits.cpuLimit).toBe(500); // High CPU limit
    expect(highLimits.memoryLimit).toBe(50 * 1024 * 1024); // High memory limit (50MB)
  });
});