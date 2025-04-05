import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  loadPlugin, 
  initializePlugin, 
  unloadPlugin, 
  clearPluginCache, 
  getCacheInfo 
} from '../../../../src/core/plugin-system/loader';
import { pluginRegistry } from '../../../../src/core/plugin-system/registry';
import { PluginManifest, DashboardAPI } from '../../../../src/core/plugin-system/types';

// Setup fetch mock
vi.mock('global', () => ({
  fetch: vi.fn()
}), { virtual: true });

// Create mock plugin manifest
const mockManifest: PluginManifest = {
  id: 'org.example.test-plugin',
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
  description: 'A test plugin',
  entryPoint: 'index.js'
};

// Create mock plugin code
const mockPluginCode = `
  module.exports = {
    initialize: async function(dashboard, mathJs, config) {
      return { success: true };
    },
    cleanup: async function() {
      return { success: true };
    },
    components: {
      panels: {
        'main-panel': function() { return null; }
      }
    },
    methods: {
      testMethod: function() { return 'test'; }
    }
  };
`;

// Create mock dashboard API
const mockDashboardAPI: DashboardAPI = {
  registerTool: vi.fn(),
  registerPanel: vi.fn(),
  registerVisualization: vi.fn(),
  showResult: vi.fn(),
  showError: vi.fn(),
  updateProgressBar: vi.fn()
};

describe('Plugin Loader', () => {
  beforeEach(() => {
    // Reset registry and mock
    pluginRegistry.clear();
    clearPluginCache();
    vi.resetAllMocks();

    // Setup fetch mock implementation
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('manifest.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockManifest)
        });
      }
      
      if (typeof url === 'string' && url.includes('index.js')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockPluginCode)
        });
      }
      
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as unknown as typeof fetch;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('loadPlugin', () => {
    it('should load plugin from URL', async () => {
      const instance = await loadPlugin('https://example.com/plugin');
      
      expect(instance).toBeDefined();
      expect(typeof instance.initialize).toBe('function');
      expect(pluginRegistry.hasPlugin('org.example.test-plugin')).toBe(true);
      
      // Check that fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('manifest.json'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('index.js'));
    });
    
    it('should load plugin from plugin directory', async () => {
      const instance = await loadPlugin('org.example.test-plugin', {
        pluginDirectory: './plugins'
      });
      
      expect(instance).toBeDefined();
      expect(typeof instance.initialize).toBe('function');
      expect(pluginRegistry.hasPlugin('org.example.test-plugin')).toBe(true);
      
      // Check that fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith('./plugins/org.example.test-plugin/manifest.json');
      expect(global.fetch).toHaveBeenCalledWith('./plugins/org.example.test-plugin/index.js');
    });
    
    it('should load plugin from source object', async () => {
      // Create a combined source object with both manifest and code
      const sourceObj = {
        manifest: mockManifest,
        code: mockPluginCode
      };
      
      const instance = await loadPlugin('test-source', {
        source: sourceObj
      });
      
      expect(instance).toBeDefined();
      expect(typeof instance.initialize).toBe('function');
      expect(pluginRegistry.hasPlugin('org.example.test-plugin')).toBe(true);
      
      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should use cache for subsequent loads', async () => {
      // Load the plugin the first time
      await loadPlugin('https://example.com/plugin');
      
      // Reset the mock to verify it's not called again
      vi.clearAllMocks();
      
      // Load again - should use cache
      const instance = await loadPlugin('https://example.com/plugin');
      
      expect(instance).toBeDefined();
      expect(typeof instance.initialize).toBe('function');
      
      // Fetch should not be called again
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Cache info should show the plugin
      const cacheInfo = getCacheInfo();
      expect(cacheInfo).toHaveLength(1);
      expect(cacheInfo[0].id).toBe('https://example.com/plugin');
    });
    
    it('should respect noCache option', async () => {
      // Load the plugin the first time
      await loadPlugin('https://example.com/plugin');
      
      // Reset the mock to verify it's called again
      vi.clearAllMocks();
      
      // Load again with noCache option
      const instance = await loadPlugin('https://example.com/plugin', { noCache: true });
      
      expect(instance).toBeDefined();
      
      // Fetch should be called again
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('manifest.json'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('index.js'));
    });
  });
  
  describe('initializePlugin', () => {
    it('should initialize a loaded plugin', async () => {
      // First load the plugin
      await loadPlugin('https://example.com/plugin');
      
      // Then initialize it
      await initializePlugin('org.example.test-plugin', mockDashboardAPI, {});
      
      // Check that the plugin is enabled
      const plugin = pluginRegistry.getPlugin('org.example.test-plugin');
      expect(plugin?.enabled).toBe(true);
      expect(plugin?.status).toBe('initialized');
    });
    
    it('should throw error if plugin is not found', async () => {
      await expect(initializePlugin('non-existent', mockDashboardAPI, {}))
        .rejects.toThrow('Plugin non-existent is not registered');
    });
  });
  
  describe('unloadPlugin', () => {
    it('should unload a loaded plugin', async () => {
      // First load the plugin
      await loadPlugin('https://example.com/plugin');
      
      // Initialize it
      await initializePlugin('org.example.test-plugin', mockDashboardAPI, {});
      
      // Then unload it
      await unloadPlugin('org.example.test-plugin');
      
      // Check that the plugin is unregistered
      expect(pluginRegistry.hasPlugin('org.example.test-plugin')).toBe(false);
    });
    
    it('should throw error if plugin is not found', async () => {
      await expect(unloadPlugin('non-existent'))
        .rejects.toThrow('Plugin non-existent is not registered');
    });
  });
  
  describe('clearPluginCache', () => {
    it('should clear the entire cache', async () => {
      // Load a plugin to populate the cache
      await loadPlugin('https://example.com/plugin');
      
      // Check that cache has the plugin
      expect(getCacheInfo()).toHaveLength(1);
      
      // Clear the cache
      clearPluginCache();
      
      // Check that cache is empty
      expect(getCacheInfo()).toHaveLength(0);
    });
    
    it('should clear specific plugin from cache', async () => {
      // Load two plugins to populate the cache
      await loadPlugin('https://example.com/plugin1');
      // For the second plugin, we'll use a modified manifest
      const modifiedManifest = { ...mockManifest, id: 'org.example.test-plugin2' };
      
      // Mock a different URL for the second plugin
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('plugin2') && url.includes('manifest.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(modifiedManifest)
          });
        } else if (url.includes('plugin2') && url.includes('index.js')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockPluginCode)
          });
        } else if (url.includes('manifest.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockManifest)
          });
        } else if (url.includes('index.js')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockPluginCode)
          });
        }
        
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }) as unknown as typeof fetch;
      
      await loadPlugin('https://example.com/plugin2');
      
      // Check that cache has both plugins
      expect(getCacheInfo()).toHaveLength(2);
      
      // Clear one plugin from cache
      clearPluginCache('https://example.com/plugin1');
      
      // Check that only one plugin remains
      const cacheInfo = getCacheInfo();
      expect(cacheInfo).toHaveLength(1);
      expect(cacheInfo[0].id).not.toBe('https://example.com/plugin1');
    });
  });
});