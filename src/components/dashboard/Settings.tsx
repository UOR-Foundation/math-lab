import { FC } from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Settings: FC = () => {
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
        Settings
      </Typography>
      <Box>
        <Typography variant="body1">
          Settings configuration will be implemented in a future iteration.
        </Typography>
      </Box>
    </Paper>
  );
};

export default Settings;