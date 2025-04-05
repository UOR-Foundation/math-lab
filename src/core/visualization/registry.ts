import React from 'react';

export type VisualizationType = '2d' | '3d' | 'tree' | 'graph' | 'custom';

// Define a generic type for visualization data
export type VisualizationData = number[] | Record<string, unknown> | unknown;

export interface Visualization {
  id: string;
  name: string;
  description: string;
  type: VisualizationType;
  // Component to render this visualization
  component: React.ComponentType<VisualizationProps>;
  // Whether this visualization can handle the given data
  canVisualize: (data: VisualizationData) => boolean;
  // Default configuration
  defaultConfig?: Record<string, unknown>;
}

export interface VisualizationProps {
  data: VisualizationData;
  width: number;
  height: number;
  config?: Record<string, unknown>;
}

class VisualizationRegistry {
  private visualizations: Map<string, Visualization> = new Map();

  /**
   * Register a new visualization
   */
  register(visualization: Visualization): void {
    if (this.visualizations.has(visualization.id)) {
      console.warn(`Visualization with ID ${visualization.id} is already registered. Overwriting.`);
    }
    this.visualizations.set(visualization.id, visualization);
  }

  /**
   * Unregister a visualization
   */
  unregister(id: string): boolean {
    return this.visualizations.delete(id);
  }

  /**
   * Get a visualization by ID
   */
  get(id: string): Visualization | undefined {
    return this.visualizations.get(id);
  }

  /**
   * Get all registered visualizations
   */
  getAll(): Visualization[] {
    return Array.from(this.visualizations.values());
  }

  /**
   * Find visualizations that can handle the given data
   */
  findCompatible(data: VisualizationData): Visualization[] {
    return this.getAll().filter(viz => viz.canVisualize(data));
  }

  /**
   * Get visualizations by type
   */
  getByType(type: VisualizationType): Visualization[] {
    return this.getAll().filter(viz => viz.type === type);
  }
}

// Singleton instance
const visualizationRegistry = new VisualizationRegistry();
export default visualizationRegistry;