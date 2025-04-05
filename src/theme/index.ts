import { createTheme, alpha } from '@mui/material/styles';

// Define mathematic-specific colors that can be adapted for both light and dark modes
const mathColors = {
  prime: '#4a90e2',    // Primary theme color from dashboard-spec
  factorial: '#f50057', // Secondary color
  constant: '#009688', // For constants like pi, e, etc.
  function: '#673ab7', // For mathematical functions
  variable: '#ff9800', // For variables in expressions
  operator: '#e91e63', // For operators
  number: '#2196f3',   // For numeric literals
  result: '#4caf50',   // For results
  error: '#f44336',    // For errors
};

// Create the light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: mathColors.prime,
      light: alpha(mathColors.prime, 0.8),
      dark: alpha(mathColors.prime, 1.2),
      contrastText: '#ffffff',
    },
    secondary: {
      main: mathColors.factorial,
      light: alpha(mathColors.factorial, 0.8),
      dark: alpha(mathColors.factorial, 1.2),
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    error: {
      main: mathColors.error,
    },
    // Custom colors for the math lab
    mathColors: {
      ...mathColors,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
});

// Create the dark theme by extending the light theme
export const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    ...lightTheme.palette,
    mode: 'dark',
    primary: {
      main: mathColors.prime,
      light: alpha(mathColors.prime, 0.8),
      dark: alpha(mathColors.prime, 1.2),
      contrastText: '#ffffff',
    },
    secondary: {
      main: mathColors.factorial,
      light: alpha(mathColors.factorial, 0.8),
      dark: alpha(mathColors.factorial, 1.2),
      contrastText: '#ffffff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
    },
    // Maintain the same mathColors in dark mode for consistency
    mathColors: {
      ...mathColors,
    },
  },
  components: {
    ...lightTheme.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
          borderRadius: 8,
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Extend the Material-UI theme to include our custom properties
declare module '@mui/material/styles' {
  interface Palette {
    mathColors: typeof mathColors;
  }

  interface PaletteOptions {
    mathColors?: Partial<typeof mathColors>;
  }
}

// Export the themes
export { lightTheme as light, darkTheme as dark };