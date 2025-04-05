import { FC } from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Calculator: FC = () => {
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
        Calculator
      </Typography>
      <Box>
        <Typography variant="body1">
          Calculator tool will be implemented in a future iteration.
        </Typography>
      </Box>
    </Paper>
  );
};

export default Calculator;