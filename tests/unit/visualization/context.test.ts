import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

import { useVisualization, VisualizationProvider } from '@/core/visualization/context';
import visualizationRegistry from '@/core/visualization/registry';

// Mock the registry functions
vi.mock('@/core/visualization/registry', () => ({
  default: {
    getAll: vi.fn(),
    getByType: vi.fn(),
    findCompatible: vi.fn(),
    get: vi.fn()
  }
}));

describe('Visualization Context', () => {
  const mockVisualizations = [
    { id: 'test-viz-1', name: 'Test 1', type: '2d' },
    { id: 'test-viz-2', name: 'Test 2', type: '3d' }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    (visualizationRegistry.getAll as jest.Mock).mockReturnValue(mockVisualizations);
    (visualizationRegistry.getByType as jest.Mock).mockImplementation((type: string) => 
      mockVisualizations.filter(viz => viz.type === type)
    );
    (visualizationRegistry.findCompatible as jest.Mock).mockReturnValue([mockVisualizations[0]]);
    (visualizationRegistry.get as jest.Mock).mockImplementation((id: string) => 
      mockVisualizations.find(viz => viz.id === id)
    );
  });

  // Wrapper component for the context provider
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(VisualizationProvider, null, children);
  };

  it('should provide access to visualization functions', () => {
    const { result } = renderHook(() => useVisualization(), { wrapper });
    
    expect(result.current.getVisualizations).toBeDefined();
    expect(result.current.getVisualizationsByType).toBeDefined();
    expect(result.current.findCompatibleVisualizations).toBeDefined();
    expect(result.current.getVisualization).toBeDefined();
  });

  it('should get all visualizations', () => {
    const { result } = renderHook(() => useVisualization(), { wrapper });
    
    result.current.getVisualizations();
    expect(visualizationRegistry.getAll).toHaveBeenCalled();
  });

  it('should get visualizations by type', () => {
    const { result } = renderHook(() => useVisualization(), { wrapper });
    
    const type = '2d';
    result.current.getVisualizationsByType(type);
    expect(visualizationRegistry.getByType).toHaveBeenCalledWith(type);
  });

  it('should find compatible visualizations', () => {
    const { result } = renderHook(() => useVisualization(), { wrapper });
    
    const data = [1, 2, 3];
    result.current.findCompatibleVisualizations(data);
    expect(visualizationRegistry.findCompatible).toHaveBeenCalledWith(data);
  });

  it('should get a specific visualization', () => {
    const { result } = renderHook(() => useVisualization(), { wrapper });
    
    const id = 'test-viz-1';
    result.current.getVisualization(id);
    expect(visualizationRegistry.get).toHaveBeenCalledWith(id);
  });

  it('should manage active visualization state', () => {
    const { result } = renderHook(() => useVisualization(), { wrapper });
    
    // Initially null
    expect(result.current.activeVisualization).toBeNull();
    
    // Set active visualization
    act(() => {
      result.current.setActiveVisualization('test-viz-1');
    });
    
    expect(result.current.activeVisualization).toBe('test-viz-1');
  });

  it('should manage visualization data state', () => {
    const { result } = renderHook(() => useVisualization(), { wrapper });
    
    // Initially null
    expect(result.current.visualizationData).toBeNull();
    
    // Set visualization data
    const testData = [1, 2, 3];
    act(() => {
      result.current.setVisualizationData(testData);
    });
    
    expect(result.current.visualizationData).toEqual(testData);
  });

  it('should update visualization config', () => {
    const { result } = renderHook(() => useVisualization(), { wrapper });
    
    // Initial empty config
    expect(result.current.visualizationConfig).toEqual({});
    
    // Update config
    act(() => {
      result.current.updateVisualizationConfig({ color: 'red', size: 10 });
    });
    
    expect(result.current.visualizationConfig).toEqual({ color: 'red', size: 10 });
    
    // Update partial config - should merge
    act(() => {
      result.current.updateVisualizationConfig({ color: 'blue' });
    });
    
    expect(result.current.visualizationConfig).toEqual({ color: 'blue', size: 10 });
  });
});