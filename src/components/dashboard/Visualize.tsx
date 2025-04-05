import { FC, useState } from 'react';
import { Typography, Box, Button, Card, CardContent } from '@mui/material';
import VisualizationContainer from '../visualization/VisualizationContainer';
import { useVisualization } from '@/core/visualization';

const Visualize: FC = () => {
  const { setVisualizationData } = useVisualization();
  
  // Sample data for demonstration
  const sampleData = [
    [5, 10, 15, 20, 25, 30, 35],
    [8, 12, 3, 17, 22, 30, 25, 13, 9],
    [42, 21, 63, 18, 9, 27]
  ];
  
  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  
  // Load a different sample dataset
  const handleChangeData = () => {
    const nextIndex = (currentDataIndex + 1) % sampleData.length;
    setCurrentDataIndex(nextIndex);
    setVisualizationData(sampleData[nextIndex]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Visualization Demo
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This is a demonstration of the visualization framework. 
            You can switch between different datasets to see how the visualizations adapt.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleChangeData}
            sx={{ mt: 1 }}
          >
            Change Dataset
          </Button>
        </CardContent>
      </Card>
      
      <Box sx={{ flexGrow: 1 }}>
        <VisualizationContainer 
          data={sampleData[currentDataIndex]} 
          width={800}
          height={400}
        />
      </Box>
    </Box>
  );
};

export default Visualize;