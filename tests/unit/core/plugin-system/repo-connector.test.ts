import { PluginRepositoryConnector, createPluginRepositoryConnector } from '../../../../src/core/plugin-system/repo-connector';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch API
global.fetch = vi.fn();

describe('PluginRepositoryConnector', () => {
  let connector: PluginRepositoryConnector;
  
  beforeEach(() => {
    connector = createPluginRepositoryConnector('https://test-repo.example.com');
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('fetchIndex', () => {
    it('should fetch the repository index', async () => {
      const mockResponse = {
        schemaVersion: '1.0.0',
        lastUpdated: '2025-04-05T12:00:00Z',
        plugins: [
          {
            id: 'org.example.test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            description: 'A test plugin',
            author: {
              name: 'Test Author',
              email: 'author@example.com',
              url: 'https://example.com'
            },
            keywords: ['test', 'plugin'],
            compatibility: {
              mathJs: '^1.0.0',
              dashboard: '^1.0.0'
            },
            type: 'official',
            path: 'official/test-plugin',
            lastUpdated: '2025-04-05T12:00:00Z'
          }
        ]
      };
      
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await connector.fetchIndex();
      
      expect(global.fetch).toHaveBeenCalledWith('https://test-repo.example.com/registry/index.json');
      expect(result).toEqual(mockResponse);
      expect(connector.getIndex()).toEqual(mockResponse);
    });
    
    it('should handle fetch errors', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });
      
      await expect(connector.fetchIndex()).rejects.toThrow('Failed to fetch repository index: Not Found');
    });
  });
  
  describe('searchPlugins', () => {
    const mockIndex = {
      schemaVersion: '1.0.0',
      lastUpdated: '2025-04-05T12:00:00Z',
      plugins: [
        {
          id: 'org.example.test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'A test plugin for testing',
          author: { name: 'Test Author' },
          keywords: ['test', 'plugin'],
          compatibility: { mathJs: '^1.0.0', dashboard: '^1.0.0' },
          type: 'official',
          path: 'official/test-plugin',
          lastUpdated: '2025-04-05T12:00:00Z'
        },
        {
          id: 'org.example.visualization-plugin',
          name: 'Visualization Plugin',
          version: '1.0.0',
          description: 'A visualization plugin',
          author: { name: 'Viz Author' },
          keywords: ['visualization', 'charts'],
          compatibility: { mathJs: '^1.0.0', dashboard: '^1.0.0' },
          type: 'official',
          path: 'official/visualization-plugin',
          lastUpdated: '2025-04-05T12:00:00Z'
        },
        {
          id: 'org.example.community-plugin',
          name: 'Community Plugin',
          version: '1.0.0',
          description: 'A community plugin',
          author: { name: 'Community Author' },
          keywords: ['community', 'plugin'],
          compatibility: { mathJs: '^1.0.0', dashboard: '^1.0.0' },
          type: 'community',
          path: 'community/community-plugin',
          lastUpdated: '2025-04-05T12:00:00Z'
        }
      ]
    };
    
    beforeEach(() => {
      // Set the index directly to avoid fetchIndex
      connector['index'] = mockIndex;
      // Also mock fetchIndex for safety
      vi.spyOn(connector, 'fetchIndex').mockResolvedValue(mockIndex);
    });
    
    it('should search plugins by query', async () => {
      const results = await connector.searchPlugins('visualization');
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('org.example.visualization-plugin');
    });
    
    it('should filter plugins by type', async () => {
      const results = await connector.searchPlugins('', { type: 'community' });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('org.example.community-plugin');
    });
    
    it('should filter plugins by keywords', async () => {
      const results = await connector.searchPlugins('', { keywords: ['charts'] });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('org.example.visualization-plugin');
    });
    
    it('should combine query and filters', async () => {
      const results = await connector.searchPlugins('plugin', { type: 'official' });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(plugin => plugin.id === 'org.example.test-plugin')).toBe(true);
    });
  });
  
  describe('getPluginDetails', () => {
    const mockIndex = {
      schemaVersion: '1.0.0',
      lastUpdated: '2025-04-05T12:00:00Z',
      plugins: [
        {
          id: 'org.example.test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'A test plugin',
          author: { name: 'Test Author' },
          keywords: ['test', 'plugin'],
          compatibility: { mathJs: '^1.0.0', dashboard: '^1.0.0' },
          type: 'official',
          path: 'official/test-plugin',
          lastUpdated: '2025-04-05T12:00:00Z'
        }
      ]
    };
    
    beforeEach(() => {
      // Set the index directly to avoid fetchIndex
      connector['index'] = mockIndex;
      // Also mock fetchIndex for safety
      vi.spyOn(connector, 'fetchIndex').mockResolvedValue(mockIndex);
    });
    
    it('should get plugin details by ID', async () => {
      const plugin = await connector.getPluginDetails('org.example.test-plugin');
      
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe('org.example.test-plugin');
      expect(plugin.name).toBe('Test Plugin');
    });
    
    it('should throw error for non-existent plugin', async () => {
      await expect(connector.getPluginDetails('non-existent')).rejects.toThrow('Plugin not found: non-existent');
    });
  });
  
  describe('fetchPluginManifest', () => {
    const mockPlugin = {
      id: 'org.example.test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: { name: 'Test Author' },
      keywords: ['test', 'plugin'],
      compatibility: { mathJs: '^1.0.0', dashboard: '^1.0.0' },
      type: 'official',
      path: 'official/test-plugin',
      lastUpdated: '2025-04-05T12:00:00Z'
    };
    
    beforeEach(() => {
      // Mock the getPluginDetails method
      vi.spyOn(connector, 'getPluginDetails').mockResolvedValue(mockPlugin);
    });
    
    it('should fetch plugin manifest', async () => {
      const mockManifest = {
        id: 'org.example.test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        compatibility: { mathJs: '^1.0.0', dashboard: '^1.0.0' },
        author: { name: 'Test Author' },
        license: 'MIT',
        description: 'A test plugin',
        entryPoint: './index.js'
      };
      
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest
      });
      
      const result = await connector.fetchPluginManifest('org.example.test-plugin');
      
      expect(global.fetch).toHaveBeenCalledWith('https://test-repo.example.com/official/test-plugin/manifest.json');
      expect(result).toEqual(mockManifest);
    });
    
    it('should handle fetch errors', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });
      
      await expect(connector.fetchPluginManifest('org.example.test-plugin')).rejects.toThrow('Failed to fetch plugin manifest: Not Found');
    });
  });
  
  describe('downloadPlugin', () => {
    const mockPlugin = {
      id: 'org.example.test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: { name: 'Test Author' },
      keywords: ['test', 'plugin'],
      compatibility: { mathJs: '^1.0.0', dashboard: '^1.0.0' },
      type: 'official',
      path: 'official/test-plugin',
      lastUpdated: '2025-04-05T12:00:00Z'
    };
    
    beforeEach(() => {
      // Mock the getPluginDetails method
      vi.spyOn(connector, 'getPluginDetails').mockResolvedValue(mockPlugin);
    });
    
    it('should download plugin package', async () => {
      const mockBlob = new Blob(['test plugin content']);
      
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });
      
      const result = await connector.downloadPlugin('org.example.test-plugin');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-repo.example.com/official/test-plugin/math-js-plugin-org.example.test-plugin-1.0.0.zip'
      );
      expect(result).toEqual(mockBlob);
    });
    
    it('should handle fetch errors', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });
      
      await expect(connector.downloadPlugin('org.example.test-plugin')).rejects.toThrow('Failed to download plugin: Not Found');
    });
  });
});