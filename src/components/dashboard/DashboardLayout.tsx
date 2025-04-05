import { FC } from 'react';
import { Grid, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import CommandBar from './CommandBar';
import MainWorkspace from './MainWorkspace';
import Sidebar from './Sidebar';
import ResultsArea from './ResultsArea';

interface DashboardLayoutProps {
  onCommandExecute?: (command: string) => void;
  onNavigate?: (destination: string) => void;
  results?: Array<{
    id: string;
    expression: string;
    result: string;
    timestamp: number;
  }>;
  panels?: Array<{
    id: string;
    title: string;
    component: React.ReactNode;
    width?: string | number;
    height?: string | number;
  }>;
}

// Create a responsive theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4a90e2', // Match the theme color from dashboard-spec
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

const DashboardLayout: FC<DashboardLayoutProps> = ({
  onCommandExecute,
  onNavigate,
  results = [],
  panels = [],
}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ p: 2 }}>
          <CommandBar onExecute={onCommandExecute} />
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 2 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} md={2} sx={{ height: '100%' }}>
              <Sidebar onNavigate={onNavigate} />
            </Grid>

            <Grid item xs={12} md={7} sx={{ height: '100%' }}>
              <MainWorkspace panels={panels} />
            </Grid>

            <Grid item xs={12} md={3} sx={{ height: '100%' }}>
              <ResultsArea results={results} />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default DashboardLayout;