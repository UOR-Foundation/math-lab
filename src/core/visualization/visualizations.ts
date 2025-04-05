import React from 'react';
import visualizationRegistry, { Visualization, VisualizationData, VisualizationProps } from './registry';
import D3Chart from '@/components/visualization/D3Chart';
import ThreeScene from '@/components/visualization/ThreeScene';

// Register a 2D bar chart visualization
const barChartVisualization: Visualization = {
  id: '2d',
  name: '2D Bar Chart',
  description: 'Simple bar chart using D3.js',
  type: '2d',
  component: (props: VisualizationProps) => {
    const { data, width, height, config } = props;
    const chartData = Array.isArray(data) && data.every(d => typeof d === 'number') ? data as number[] : [];
    return React.createElement(D3Chart, { 
      data: chartData,
      width, 
      height, 
      color: (config?.color as string) || '#4a90e2'
    });
  },
  canVisualize: (data: VisualizationData) => {
    return Array.isArray(data) && data.every(item => typeof item === 'number');
  },
  defaultConfig: {
    color: '#4a90e2'
  }
};

// Register a 3D visualization
const threeJsVisualization: Visualization = {
  id: '3d',
  name: '3D Visualization',
  description: 'Three.js based 3D visualization',
  type: '3d',
  component: (props: VisualizationProps) => {
    const { data, width, height } = props;
    const threeData = Array.isArray(data) && data.every(d => typeof d === 'number') ? data as number[] : undefined;
    return React.createElement(ThreeScene, { 
      data: threeData,
      width, 
      height
    });
  },
  canVisualize: (data: VisualizationData) => {
    return Array.isArray(data) && data.every(item => typeof item === 'number');
  },
  defaultConfig: {
    rotationSpeed: 0.01
  }
};

/**
 * Initialize all built-in visualizations
 */
export function initializeVisualizations(): void {
  visualizationRegistry.register(barChartVisualization);
  visualizationRegistry.register(threeJsVisualization);
  
  console.log('Visualization registry initialized with built-in visualizations');
}

export default {
  initializeVisualizations
};