import { describe, it, expect, beforeEach } from 'vitest';
import visualizationRegistry, { Visualization } from '@/core/visualization/registry';

describe('Visualization Registry', () => {
  // Mock visualization components
  const mockViz1: Visualization = {
    id: 'test-viz-1',
    name: 'Test Visualization 1',
    description: 'A test visualization',
    type: '2d',
    component: () => null,
    canVisualize: (data) => Array.isArray(data)
  };

  const mockViz2: Visualization = {
    id: 'test-viz-2',
    name: 'Test Visualization 2',
    description: 'Another test visualization',
    type: '3d',
    component: () => null,
    canVisualize: (data) => typeof data === 'object' && data !== null
  };

  // Clear registry before each test
  beforeEach(() => {
    // Unregister any existing visualizations
    visualizationRegistry.getAll().forEach(viz => {
      visualizationRegistry.unregister(viz.id);
    });
  });

  it('should register a visualization', () => {
    visualizationRegistry.register(mockViz1);
    expect(visualizationRegistry.getAll().length).toBe(1);
    expect(visualizationRegistry.get('test-viz-1')).toEqual(mockViz1);
  });

  it('should unregister a visualization', () => {
    visualizationRegistry.register(mockViz1);
    expect(visualizationRegistry.getAll().length).toBe(1);
    
    const result = visualizationRegistry.unregister('test-viz-1');
    expect(result).toBe(true);
    expect(visualizationRegistry.getAll().length).toBe(0);
  });

  it('should get visualizations by type', () => {
    visualizationRegistry.register(mockViz1);
    visualizationRegistry.register(mockViz2);
    
    const type2dVisualizations = visualizationRegistry.getByType('2d');
    expect(type2dVisualizations.length).toBe(1);
    expect(type2dVisualizations[0].id).toBe('test-viz-1');
    
    const type3dVisualizations = visualizationRegistry.getByType('3d');
    expect(type3dVisualizations.length).toBe(1);
    expect(type3dVisualizations[0].id).toBe('test-viz-2');
  });

  it('should find compatible visualizations', () => {
    visualizationRegistry.register(mockViz1);
    visualizationRegistry.register(mockViz2);
    
    const arrayData = [1, 2, 3];
    const compatibleWithArray = visualizationRegistry.findCompatible(arrayData);
    
    // Both visualizations might be compatible, get the test-viz-1 specifically
    const testViz1 = compatibleWithArray.find(viz => viz.id === 'test-viz-1');
    expect(testViz1).toBeDefined();
    expect(testViz1?.id).toBe('test-viz-1');
    
    const objectData = { foo: 'bar' };
    const compatibleWithObject = visualizationRegistry.findCompatible(objectData);
    expect(compatibleWithObject.length).toBe(1);
    expect(compatibleWithObject[0].id).toBe('test-viz-2');
  });

  it('should warn when registering a visualization with an existing ID', () => {
    // Mock console.warn
    const originalWarn = console.warn;
    const mockWarn = vi.fn();
    console.warn = mockWarn;
    
    // Register visualization
    visualizationRegistry.register(mockViz1);
    
    // Register another visualization with the same ID
    visualizationRegistry.register({
      ...mockViz2,
      id: 'test-viz-1'
    });
    
    // Verify warning was logged
    expect(mockWarn).toHaveBeenCalledWith(
      'Visualization with ID test-viz-1 is already registered. Overwriting.'
    );
    
    // Restore console.warn
    console.warn = originalWarn;
  });
});