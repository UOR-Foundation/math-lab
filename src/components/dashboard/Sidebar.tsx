import { FC } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Paper } from '@mui/material';

// You can replace these with actual icons from @mui/icons-material
const CalculateIcon = () => <span>🧮</span>;
const VisualizeIcon = () => <span>📊</span>;
const SettingsIcon = () => <span>⚙️</span>;
const PluginsIcon = () => <span>🧩</span>;

interface SidebarProps {
  onNavigate?: (destination: string) => void;
}

const Sidebar: FC<SidebarProps> = ({ onNavigate }) => {
  const handleNavigation = (destination: string) => {
    if (onNavigate) {
      onNavigate(destination);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%',
        borderRadius: 2,
        overflow: 'auto'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 360 }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigation('calculator')}>
              <ListItemIcon>
                <CalculateIcon />
              </ListItemIcon>
              <ListItemText primary="Calculator" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigation('visualize')}>
              <ListItemIcon>
                <VisualizeIcon />
              </ListItemIcon>
              <ListItemText primary="Visualize" />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigation('plugins')}>
              <ListItemIcon>
                <PluginsIcon />
              </ListItemIcon>
              <ListItemText primary="Plugins" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigation('settings')}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default Sidebar;