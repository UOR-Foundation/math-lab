import { FC } from 'react';
import { Paper, Box, Typography } from '@mui/material';

interface Panel {
  id: string;
  title: string;
  component: React.ReactNode;
  width?: string | number;
  height?: string | number;
}

interface MainWorkspaceProps {
  panels?: Panel[];
  layout?: 'grid' | 'tabs' | 'stack';
}

const MainWorkspace: FC<MainWorkspaceProps> = ({ 
  panels = []
  // layout parameter is currently unused but will be used in future
  // layout = 'grid' 
}) => {
  // This is a simple implementation. In a real application, you might want to use
  // a library like react-grid-layout for more advanced layout capabilities
  
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
        Workspace
      </Typography>
      
      {panels.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary'
        }}>
          <Typography>No active panels. Select a tool from the sidebar.</Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2,
          height: '100%',
          overflow: 'auto'
        }}>
          {panels.map((panel) => (
            <Paper
              key={panel.id}
              elevation={2}
              sx={{
                p: 2,
                width: panel.width || '100%',
                height: panel.height || 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                {panel.title}
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                {panel.component}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default MainWorkspace;