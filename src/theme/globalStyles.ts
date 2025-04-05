import { Theme } from '@mui/material/styles';

// Define global styles for the app
export const getGlobalStyles = (theme: Theme) => ({
  // Reset and base styles
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  'html, body': {
    width: '100%',
    height: '100%',
    fontSize: '16px',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    overflowX: 'hidden',
  },
  body: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    transition: theme.transitions.create(['background-color', 'color'], {
      duration: theme.transitions.duration.standard,
    }),
  },
  '#root': {
    width: '100%',
    height: '100%',
  },
  // Typography adjustments
  'h1, h2, h3, h4, h5, h6': {
    margin: theme.spacing(2, 0),
    fontWeight: 500,
    lineHeight: 1.2,
  },
  p: {
    marginBottom: theme.spacing(2),
    lineHeight: 1.5,
  },
  a: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  // Form elements styling
  'input, textarea, select': {
    fontFamily: theme.typography.fontFamily,
  },
  // Math expression specific styles
  '.math-expression': {
    fontFamily: '"Computer Modern", serif',
    fontSize: '1.1rem',
  },
  '.calculator-result': {
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(0, 0, 0, 0.03)' 
      : 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1, 2),
    fontFamily: 'monospace',
    fontSize: '1.1rem',
  },
  // Scrollbar styling
  '::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '::-webkit-scrollbar-track': {
    background: theme.palette.mode === 'light' 
      ? 'rgba(0, 0, 0, 0.05)' 
      : 'rgba(255, 255, 255, 0.05)',
  },
  '::-webkit-scrollbar-thumb': {
    background: theme.palette.mode === 'light' 
      ? 'rgba(0, 0, 0, 0.2)' 
      : 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.mode === 'light' 
        ? 'rgba(0, 0, 0, 0.3)' 
        : 'rgba(255, 255, 255, 0.3)',
    },
  },
  // Code and pre styling for mathematical expressions
  'code, pre': {
    fontFamily: '"Fira Code", monospace',
    fontSize: '0.9rem',
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(0, 0, 0, 0.05)' 
      : 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5, 1),
  },
  pre: {
    padding: theme.spacing(2),
    overflowX: 'auto',
  },
});