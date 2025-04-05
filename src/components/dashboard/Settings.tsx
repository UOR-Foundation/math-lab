import { FC } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Switch,
  Divider,
  FormControl,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import { useTheme } from '../../hooks/useTheme';

const Settings: FC = () => {
  const { mode, toggleTheme } = useTheme();
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        height: '100%'
      }}
    >
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>
      
      <Box sx={{ mt: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Appearance
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary="Dark Mode" 
              secondary="Toggle between light and dark theme"
            />
            <ListItemSecondaryAction>
              <Switch 
                edge="end"
                checked={mode === 'dark'}
                onChange={toggleTheme}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Box>
      
      <Divider />
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Computation
        </Typography>
        
        <FormControl component="fieldset" variant="standard">
          <FormGroup>
            <FormControlLabel
              control={
                <Switch checked={true} name="workerEnabled" />
              }
              label="Enable Web Workers"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, ml: 2 }}>
              Offload heavy calculations to background threads
            </Typography>
            
            <FormControlLabel
              sx={{ mt: 2 }}
              control={
                <Switch checked={true} name="cacheEnabled" />
              }
              label="Enable Calculation Cache"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, ml: 2 }}>
              Store previous calculation results for faster retrieval
            </Typography>
          </FormGroup>
        </FormControl>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          About
        </Typography>
        <Typography variant="body2">
          Math Lab v1.0.0
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Official reference implementation dashboard for the UOR Foundation's math-js library
        </Typography>
      </Box>
    </Paper>
  );
};

export default Settings;