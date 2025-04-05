/**
 * Plugin Hooks Tests
 * 
 * Tests for the plugin system hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePluginSystem } from '../../../src/hooks/usePluginSystem';
import { usePluginEvent, usePluginEventPublisher } from '../../../src/hooks/usePluginEvents';
import { usePluginUi } from '../../../src/hooks/usePluginUi';
import { getPluginApiService } from '../../../src/core/plugin-system/service';

// Mock the getPluginApiService function and its return values
vi.mock('../../../src/core/plugin-system/service', () => {
  const mockPluginManager = {
    loadPlugin: vi.fn(),
    registerPlugin: vi.fn(),
    enablePlugin: vi.fn(),
    disablePlugin: vi.fn(),
    unloadPlugin: vi.fn(),
    getAllPlugins: vi.fn(),
    getEnabledPlugins: vi.fn(),
    getPluginDetails: vi.fn(),
  };
  
  const mockEventApi = {
    subscribe: vi.fn().mockReturnValue(() => {}), // Return an unsubscribe function
    publish: vi.fn(),
  };
  
  const mockUiApi = {
    showNotification: vi.fn(),
    showModal: vi.fn(),
    showConfirm: vi.fn(),
  };
  
  return {
    getPluginApiService: vi.fn(() => ({
      getPluginManager: vi.fn(() => mockPluginManager),
      getEventApi: vi.fn(() => mockEventApi),
      getUiApi: vi.fn(() => mockUiApi),
      getEventBus: vi.fn(() => ({
        subscribe: mockEventApi.subscribe,
        publish: mockEventApi.publish,
      })),
    })),
  };
});

describe('Plugin Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('usePluginSystem', () => {
    it('should return plugin system functions', () => {
      const { result } = renderHook(() => usePluginSystem());
      
      expect(result.current.loadPlugin).toBeInstanceOf(Function);
      expect(result.current.registerPlugin).toBeInstanceOf(Function);
      expect(result.current.enablePlugin).toBeInstanceOf(Function);
      expect(result.current.disablePlugin).toBeInstanceOf(Function);
      expect(result.current.unloadPlugin).toBeInstanceOf(Function);
      expect(result.current.getAllPlugins).toBeInstanceOf(Function);
      expect(result.current.getEnabledPlugins).toBeInstanceOf(Function);
      expect(result.current.getPluginDetails).toBeInstanceOf(Function);
      expect(result.current.pluginManager).toBeDefined();
    });
    
    it('should call plugin manager methods', async () => {
      const { result } = renderHook(() => usePluginSystem());
      
      // Call loadPlugin
      await act(async () => {
        await result.current.loadPlugin('test-plugin');
      });
      
      // Get plugin manager from mock
      const pluginManager = getPluginApiService().getPluginManager();
      
      // Verify method was called
      expect(pluginManager.loadPlugin).toHaveBeenCalledWith('test-plugin');
    });
  });
  
  describe('usePluginEvent', () => {
    it('should subscribe to events', () => {
      const callback = vi.fn();
      renderHook(() => usePluginEvent('test-event', callback));
      
      // Get event API from mock
      const eventApi = getPluginApiService().getEventApi();
      
      // Verify subscribe was called
      expect(eventApi.subscribe).toHaveBeenCalledWith('test-event', expect.any(Function));
    });
  });
  
  describe('usePluginEventPublisher', () => {
    it('should return publish function', () => {
      const { result } = renderHook(() => usePluginEventPublisher());
      
      expect(result.current).toBeInstanceOf(Function);
    });
    
    it('should call publish method', () => {
      const { result } = renderHook(() => usePluginEventPublisher());
      
      // Call publish
      act(() => {
        result.current('test-event', { test: 'data' });
      });
      
      // Get event API from mock
      const eventApi = getPluginApiService().getEventApi();
      
      // Verify publish was called
      expect(eventApi.publish).toHaveBeenCalledWith('test-event', { test: 'data' });
    });
  });
  
  describe('usePluginUi', () => {
    it('should return UI functions', () => {
      const { result } = renderHook(() => usePluginUi());
      
      expect(result.current.showNotification).toBeInstanceOf(Function);
      expect(result.current.showModal).toBeInstanceOf(Function);
      expect(result.current.showConfirm).toBeInstanceOf(Function);
    });
    
    it('should call UI API methods', () => {
      const { result } = renderHook(() => usePluginUi());
      
      // Call showNotification
      act(() => {
        result.current.showNotification('Test notification', { type: 'info' });
      });
      
      // Get UI API from mock
      const uiApi = getPluginApiService().getUiApi();
      
      // Verify method was called
      expect(uiApi.showNotification).toHaveBeenCalledWith('Test notification', { type: 'info' });
    });
  });
});