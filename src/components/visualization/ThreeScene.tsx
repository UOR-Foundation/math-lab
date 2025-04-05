import React, { useRef, useEffect } from 'react';
import { threeJSManager } from '@/core/visualization';
import { Box } from '@mui/material';

interface ThreeSceneProps {
  width: number;
  height: number;
  data?: number[]; // Optional data to visualize
}

/**
 * A basic Three.js scene component
 */
const ThreeScene: React.FC<ThreeSceneProps> = ({ width, height, data }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the Three.js manager with our container
    threeJSManager.initialize(containerRef.current);

    // If we have data, create a visualization
    if (data && data.length > 0) {
      // Clear existing objects
      threeJSManager.clearScene();

      // Create objects based on data
      data.forEach((value, index) => {
        const size = Math.max(0.2, value / 10);
        const cube = threeJSManager.createTestCube(size);
        
        // Position cubes in a row
        cube.position.x = (index - (data.length - 1) / 2) * 1.5;
        
        // Use value to determine y position
        cube.position.y = size / 2;
      });
    } else {
      // Just add a test cube if no data
      threeJSManager.createTestCube();
    }

    // Clean up when component unmounts
    return () => {
      threeJSManager.dispose();
    };
  }, [data]);

  // Update size when width/height changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    
    // Trigger resize to update renderer
    window.dispatchEvent(new Event('resize'));
  }, [width, height]);

  return (
    <Box 
      ref={containerRef} 
      sx={{ 
        width, 
        height,
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden'
      }} 
    />
  );
};

export default ThreeScene;