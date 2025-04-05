import { FC } from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Visualize: FC = () => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        height: '100%'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Visualization
      </Typography>
      <Box>
        <Typography variant="body1">
          Visualization tools will be implemented in a future iteration.
        </Typography>
      </Box>
    </Paper>
  );
};

export default Visualize;