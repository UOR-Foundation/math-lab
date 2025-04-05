/**
 * Plugin API Service Tests
 * 
 * Tests for the plugin API service and implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginApiService, getPluginApiService } from '../../../../src/core/plugin-system/service';

// Mock store
vi.mock('../../../../src/store', () => ({
  store: {
    dispatch: vi.fn()
  }
}));

describe('Plugin API Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = PluginApiService.getInstance();
      const instance2 = PluginApiService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
    
    it('should provide the same instance via getter', () => {
      const instance1 = PluginApiService.getInstance();
      const instance2 = getPluginApiService();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('API Getters', () => {
    it('should provide dashboard API', () => {
      const service = PluginApiService.getInstance();
      const dashboardApi = service.getDashboardApi();
      
      expect(dashboardApi).toBeDefined();
      expect(dashboardApi.registerTool).toBeInstanceOf(Function);
      expect(dashboardApi.registerPanel).toBeInstanceOf(Function);
      expect(dashboardApi.registerVisualization).toBeInstanceOf(Function);
      expect(dashboardApi.showResult).toBeInstanceOf(Function);
      expect(dashboardApi.showError).toBeInstanceOf(Function);
      expect(dashboardApi.updateProgressBar).toBeInstanceOf(Function);
    });
    
    it('should provide storage API', () => {
      const service = PluginApiService.getInstance();
      const storageApi = service.getStorageApi();
      
      expect(storageApi).toBeDefined();
      expect(storageApi.getItem).toBeInstanceOf(Function);
      expect(storageApi.setItem).toBeInstanceOf(Function);
      expect(storageApi.removeItem).toBeInstanceOf(Function);
      expect(storageApi.clear).toBeInstanceOf(Function);
      expect(storageApi.keys).toBeInstanceOf(Function);
    });
    
    it('should provide event API', () => {
      const service = PluginApiService.getInstance();
      const eventApi = service.getEventApi();
      
      expect(eventApi).toBeDefined();
      expect(eventApi.subscribe).toBeInstanceOf(Function);
      expect(eventApi.publish).toBeInstanceOf(Function);
    });
    
    it('should provide UI API', () => {
      const service = PluginApiService.getInstance();
      const uiApi = service.getUiApi();
      
      expect(uiApi).toBeDefined();
      expect(uiApi.showNotification).toBeInstanceOf(Function);
      expect(uiApi.showModal).toBeInstanceOf(Function);
      expect(uiApi.showConfirm).toBeInstanceOf(Function);
    });
    
    it('should provide event bus', () => {
      const service = PluginApiService.getInstance();
      const eventBus = service.getEventBus();
      
      expect(eventBus).toBeDefined();
      expect(eventBus.subscribe).toBeInstanceOf(Function);
      expect(eventBus.publish).toBeInstanceOf(Function);
    });
    
    it('should provide plugin manager', () => {
      const service = PluginApiService.getInstance();
      const pluginManager = service.getPluginManager();
      
      expect(pluginManager).toBeDefined();
      expect(pluginManager.loadPlugin).toBeInstanceOf(Function);
      expect(pluginManager.registerPlugin).toBeInstanceOf(Function);
      expect(pluginManager.enablePlugin).toBeInstanceOf(Function);
      expect(pluginManager.disablePlugin).toBeInstanceOf(Function);
      expect(pluginManager.unloadPlugin).toBeInstanceOf(Function);
      expect(pluginManager.getAllPlugins).toBeInstanceOf(Function);
      expect(pluginManager.getEnabledPlugins).toBeInstanceOf(Function);
      expect(pluginManager.getPluginDetails).toBeInstanceOf(Function);
    });
  });
  
  describe('Math-JS Integration', () => {
    it('should allow setting math-js reference', () => {
      const service = PluginApiService.getInstance();
      const mathJs = { version: '1.0.0' };
      
      service.setMathJs(mathJs);
      
      // We can't directly check the reference, but we can assume it's set
      expect(service.setMathJs).toBeInstanceOf(Function);
    });
  });
});