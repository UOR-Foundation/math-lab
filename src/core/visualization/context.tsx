import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import visualizationRegistry, { Visualization, VisualizationType, VisualizationData } from './registry';

interface VisualizationContextType {
  // Currently selected visualization
  activeVisualization: string | null;
  // Set the active visualization
  setActiveVisualization: (id: string | null) => void;
  // Get all registered visualizations
  getVisualizations: () => Visualization[];
  // Get visualizations by type
  getVisualizationsByType: (type: VisualizationType) => Visualization[];
  // Find visualizations compatible with data
  findCompatibleVisualizations: (data: VisualizationData) => Visualization[];
  // Get a visualization by ID
  getVisualization: (id: string) => Visualization | undefined;
  // Current data to visualize
  visualizationData: VisualizationData | null;
  // Set the data to visualize
  setVisualizationData: (data: VisualizationData) => void;
  // Visualization configuration
  visualizationConfig: Record<string, unknown>;
  // Update visualization configuration
  updateVisualizationConfig: (config: Record<string, unknown>) => void;
}

const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined);

export const VisualizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeVisualization, setActiveVisualization] = useState<string | null>(null);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [visualizationConfig, setVisualizationConfig] = useState<Record<string, unknown>>({});

  const getVisualizations = useCallback(() => {
    return visualizationRegistry.getAll();
  }, []);

  const getVisualizationsByType = useCallback((type: VisualizationType) => {
    return visualizationRegistry.getByType(type);
  }, []);

  const findCompatibleVisualizations = useCallback((data: VisualizationData) => {
    return visualizationRegistry.findCompatible(data);
  }, []);

  const getVisualization = useCallback((id: string) => {
    return visualizationRegistry.get(id);
  }, []);

  const updateVisualizationConfig = useCallback((config: Record<string, unknown>) => {
    setVisualizationConfig(prevConfig => ({
      ...prevConfig,
      ...config
    }));
  }, []);

  const value = {
    activeVisualization,
    setActiveVisualization,
    getVisualizations,
    getVisualizationsByType,
    findCompatibleVisualizations,
    getVisualization,
    visualizationData,
    setVisualizationData,
    visualizationConfig,
    updateVisualizationConfig
  };

  return (
    <VisualizationContext.Provider value={value}>
      {children}
    </VisualizationContext.Provider>
  );
};

/* eslint-disable react-refresh/only-export-components */
export const useVisualization = (): VisualizationContextType => {
  const context = useContext(VisualizationContext);
  if (context === undefined) {
    throw new Error('useVisualization must be used within a VisualizationProvider');
  }
  return context;
};

export default VisualizationContext;