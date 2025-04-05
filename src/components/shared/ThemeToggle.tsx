import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Dark mode icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Light mode icon
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  tooltipPlacement = 'bottom' 
}) => {
  const { mode, toggleTheme } = useTheme();

  return (
    <Tooltip 
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`} 
      placement={tooltipPlacement}
    >
      <IconButton 
        onClick={toggleTheme} 
        color="inherit" 
        aria-label="toggle theme"
        size="large"
      >
        {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;