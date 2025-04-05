import React, { useState, useEffect, ReactNode } from 'react';
import { Theme } from '@mui/material/styles';
import { light, dark } from '../theme';
import { GlobalStyles } from '@mui/material';
import { getGlobalStyles } from '../theme/globalStyles';
import { ThemeContext } from '../context/ThemeContext';

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the saved theme preference from local storage or default to light mode
  const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
  const [mode, setMode] = useState<'light' | 'dark'>(savedTheme || 'light');
  const [theme, setTheme] = useState<Theme>(mode === 'light' ? light : dark);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setTheme(newMode === 'light' ? light : dark);
    // Save theme preference to local storage
    localStorage.setItem('themeMode', newMode);
  };

  // Effect to listen for system theme preference changes
  useEffect(() => {
    // Only apply system preference if there's no saved theme
    if (!savedTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        const newMode = e.matches ? 'dark' : 'light';
        setMode(newMode);
        setTheme(newMode === 'light' ? light : dark);
      };

      // Initial check
      handleChange(mediaQuery);

      // Listen for changes
      mediaQuery.addEventListener('change', handleChange);

      // Cleanup
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [savedTheme]);

  // Provide the theme context
  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
      <GlobalStyles styles={(theme) => getGlobalStyles(theme)} />
      {children}
    </ThemeContext.Provider>
  );
};