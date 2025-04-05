import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { useVisualization, Visualization, VisualizationData } from '@/core/visualization';
import VisualizationPanel from './VisualizationPanel';
import D3Chart from './D3Chart';
import ThreeScene from './ThreeScene';

interface VisualizationContainerProps {
  data?: VisualizationData;
  width?: number;
  height?: number;
}

/**
 * Container component that manages visualization selection and rendering
 */
const VisualizationContainer: React.FC<VisualizationContainerProps> = ({ 
  data,
  width = 800,
  height = 400
}) => {
  const { 
    findCompatibleVisualizations,
    activeVisualization,
    setActiveVisualization,
    visualizationData,
    setVisualizationData,
  } = useVisualization();

  const [_compatibleVisualizations, setCompatibleVisualizations] = useState<Visualization[]>([]);
  const [selectedViz, setSelectedViz] = useState<string>('');

  // Update data when it changes
  useEffect(() => {
    if (data) {
      setVisualizationData(data);
    }
  }, [data, setVisualizationData]);

  // Find compatible visualizations when data changes
  useEffect(() => {
    if (visualizationData) {
      const compatible = findCompatibleVisualizations(visualizationData);
      setCompatibleVisualizations(compatible);
      
      // If we have compatible visualizations and none is selected, select the first one
      if (compatible.length > 0 && !activeVisualization) {
        setActiveVisualization(compatible[0].id);
        setSelectedViz(compatible[0].id);
      }
    }
  }, [visualizationData, findCompatibleVisualizations, activeVisualization, setActiveVisualization]);

  // Handle visualization selection
  const handleVisualizationChange = (event: SelectChangeEvent<string>) => {
    const vizId = event.target.value;
    setSelectedViz(vizId);
    setActiveVisualization(vizId);
  };

  // Render visualization based on type
  const renderVisualization = () => {
    if (!visualizationData) {
      return (
        <Typography color="text.secondary">
          No data available for visualization
        </Typography>
      );
    }

    // For demo purposes, we'll just check data type and render appropriately
    // In a real implementation, this would use the visualization registry
    if (Array.isArray(visualizationData) && visualizationData.every(item => typeof item === 'number')) {
      // For numeric arrays, render either 2D or 3D based on selection
      if (selectedViz === '3d') {
        return <ThreeScene width={width - 40} height={height - 100} data={visualizationData} />;
      } else {
        return <D3Chart data={visualizationData} width={width - 40} height={height - 100} />;
      }
    }

    return (
      <Typography color="text.secondary">
        No suitable visualization found for this data type
      </Typography>
    );
  };

  return (
    <VisualizationPanel title="Visualization">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Visualization Type</InputLabel>
            <Select
              value={selectedViz}
              onChange={handleVisualizationChange}
              label="Visualization Type"
            >
              <MenuItem value="2d">2D Bar Chart</MenuItem>
              <MenuItem value="3d">3D Visualization</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          bgcolor: 'background.default',
          overflow: 'hidden'
        }}>
          {renderVisualization()}
        </Box>
      </Box>
    </VisualizationPanel>
  );
};

export default VisualizationContainer;