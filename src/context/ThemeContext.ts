import { createContext } from 'react';
import { Theme } from '@mui/material/styles';
import { light } from '../theme';

// Define the theme context type
type ThemeContextType = {
  mode: 'light' | 'dark';
  theme: Theme;
  toggleTheme: () => void;
};

// Create the theme context with a default value
export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  theme: light,
  toggleTheme: () => {},
});