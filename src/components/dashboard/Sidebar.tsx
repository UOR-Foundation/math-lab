import { FC } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Paper, Box as FooterBox } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ExtensionIcon from '@mui/icons-material/Extension';
import ThemeToggle from '../shared/ThemeToggle';

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
                <BarChartIcon />
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
                <ExtensionIcon />
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
      
      <FooterBox sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'center',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <ThemeToggle />
      </FooterBox>
    </Paper>
  );
};

export default Sidebar;