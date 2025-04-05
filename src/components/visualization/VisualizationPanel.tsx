import { FC } from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface VisualizationPanelProps {
  title: string;
  children?: React.ReactNode;
}

const VisualizationPanel: FC<VisualizationPanelProps> = ({ title, children }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        bgcolor: 'background.default'
      }}>
        {children || (
          <Typography color="text.secondary">
            Visualization content will appear here
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default VisualizationPanel;