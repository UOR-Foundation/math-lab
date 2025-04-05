import { FC, useState } from 'react';
import { 
  Grid, 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  Drawer, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Menu, 
  MenuItem, 
  Divider, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Select, 
  FormControl, 
  InputLabel, 
  ListItemText, 
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme as useMuiTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GridViewIcon from '@mui/icons-material/GridView';
import TabIcon from '@mui/icons-material/Tab';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import { useTheme } from '../../hooks/useTheme';
import CommandBar from './CommandBar';
import MainWorkspace, { Panel } from './MainWorkspace';
import Sidebar from './Sidebar';
import ResultsArea from './ResultsArea';
import { Workspace } from '../../store/slices/workspaceSlice';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createWorkspace, setWorkspaceLayout } from '../../store/slices/workspaceSlice';

interface DashboardLayoutProps {
  onCommandExecute?: (command: string, result: string) => void;
  onNavigate?: (destination: string) => void;
  onWorkspaceChange?: (workspaceId: string) => void;
  results?: Array<{
    id: string;
    expression: string;
    result: string;
    timestamp: number;
  }>;
  panels?: Panel[];
  workspaces?: Workspace[];
  currentWorkspaceId?: string;
  layout?: 'grid' | 'tabs' | 'stack';
}

const DashboardLayout: FC<DashboardLayoutProps> = ({
  onCommandExecute,
  onNavigate,
  onWorkspaceChange,
  results = [],
  panels = [],
  workspaces = [],
  currentWorkspaceId,
  layout = 'grid',
}) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // State for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceMenuAnchor, setWorkspaceMenuAnchor] = useState<null | HTMLElement>(null);
  const [layoutMenuAnchor, setLayoutMenuAnchor] = useState<null | HTMLElement>(null);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceLayout, setNewWorkspaceLayout] = useState('grid');
  
  // Get the current workspace
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Handle workspace menu
  const openWorkspaceMenu = (event: React.MouseEvent<HTMLElement>) => {
    setWorkspaceMenuAnchor(event.currentTarget);
  };
  
  const closeWorkspaceMenu = () => {
    setWorkspaceMenuAnchor(null);
  };
  
  // Handle layout menu
  const openLayoutMenu = (event: React.MouseEvent<HTMLElement>) => {
    setLayoutMenuAnchor(event.currentTarget);
  };
  
  const closeLayoutMenu = () => {
    setLayoutMenuAnchor(null);
  };
  
  // Handle workspace changes
  const handleWorkspaceChange = (id: string) => {
    if (onWorkspaceChange) {
      onWorkspaceChange(id);
    }
    closeWorkspaceMenu();
  };
  
  // Handle layout changes
  const handleLayoutChange = (layoutId: string) => {
    if (currentWorkspaceId) {
      dispatch(setWorkspaceLayout({ id: currentWorkspaceId, layoutId }));
    }
    closeLayoutMenu();
  };
  
  // Create workspace dialog
  const openCreateWorkspaceDialog = () => {
    setCreateWorkspaceOpen(true);
    closeWorkspaceMenu();
  };
  
  const closeCreateWorkspaceDialog = () => {
    setCreateWorkspaceOpen(false);
    setNewWorkspaceName('');
    setNewWorkspaceLayout('grid');
  };
  
  const handleNewWorkspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewWorkspaceName(e.target.value);
  };
  
  const handleNewWorkspaceLayoutChange = (e: SelectChangeEvent) => {
    setNewWorkspaceLayout(e.target.value);
  };
  
  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      dispatch(createWorkspace({ 
        name: newWorkspaceName.trim(),
        layout: newWorkspaceLayout
      }));
      closeCreateWorkspaceDialog();
    }
  };
  
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
        {/* App Bar */}
        <AppBar 
          position="static" 
          color="default" 
          elevation={0}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Toolbar variant="dense">
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={toggleSidebar}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {/* Workspace Selector */}
            <Button
              onClick={openWorkspaceMenu}
              color="inherit"
              sx={{ textTransform: 'none', mr: 2 }}
              endIcon={<MoreVertIcon />}
            >
              <Typography variant="subtitle1" component="div" noWrap>
                {currentWorkspace?.name || 'Workspace'}
              </Typography>
            </Button>
            <Menu
              anchorEl={workspaceMenuAnchor}
              open={Boolean(workspaceMenuAnchor)}
              onClose={closeWorkspaceMenu}
            >
              {workspaces.map(workspace => (
                <MenuItem 
                  key={workspace.id}
                  onClick={() => handleWorkspaceChange(workspace.id)}
                  selected={workspace.id === currentWorkspaceId}
                >
                  <ListItemText 
                    primary={workspace.name}
                    secondary={`Created: ${new Date(workspace.createdAt).toLocaleDateString()}`}
                  />
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={openCreateWorkspaceDialog}>
                <AddIcon fontSize="small" sx={{ mr: 1 }} />
                <ListItemText primary="Create New Workspace" />
              </MenuItem>
            </Menu>

            {/* Layout Selector */}
            <ToggleButtonGroup
              value={layout}
              exclusive
              onChange={(_, newLayout) => {
                if (newLayout && currentWorkspaceId) {
                  dispatch(setWorkspaceLayout({ id: currentWorkspaceId, layoutId: newLayout }));
                }
              }}
              aria-label="layout type"
              size="small"
              sx={{ ml: 2, display: { xs: 'none', sm: 'flex' } }}
            >
              <ToggleButton value="grid" aria-label="grid layout">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="tabs" aria-label="tabs layout">
                <TabIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="stack" aria-label="stack layout">
                <ViewStreamIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            
            {/* Mobile layout menu */}
            {isMobile && (
              <>
                <IconButton 
                  color="inherit" 
                  onClick={openLayoutMenu}
                  sx={{ ml: 1 }}
                >
                  {layout === 'grid' ? <GridViewIcon /> : 
                   layout === 'tabs' ? <TabIcon /> : <ViewStreamIcon />}
                </IconButton>
                <Menu
                  anchorEl={layoutMenuAnchor}
                  open={Boolean(layoutMenuAnchor)}
                  onClose={closeLayoutMenu}
                >
                  <MenuItem 
                    onClick={() => handleLayoutChange('grid')}
                    selected={layout === 'grid'}
                  >
                    <GridViewIcon fontSize="small" sx={{ mr: 1 }} />
                    <ListItemText primary="Grid Layout" />
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleLayoutChange('tabs')}
                    selected={layout === 'tabs'}
                  >
                    <TabIcon fontSize="small" sx={{ mr: 1 }} />
                    <ListItemText primary="Tabs Layout" />
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleLayoutChange('stack')}
                    selected={layout === 'stack'}
                  >
                    <ViewStreamIcon fontSize="small" sx={{ mr: 1 }} />
                    <ListItemText primary="Stack Layout" />
                  </MenuItem>
                </Menu>
              </>
            )}

            <Box sx={{ flexGrow: 1 }} />
            
            {/* Command bar */}
            <Box sx={{ 
              width: { xs: '100%', sm: 'auto' }, 
              maxWidth: { xs: '60%', sm: '300px' }
            }}>
              <CommandBar onExecute={onCommandExecute} />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 2 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Sidebar - desktop */}
            {!isMobile && (
              <Grid item xs={12} md={2} sx={{ height: '100%' }}>
                <Sidebar onNavigate={onNavigate} />
              </Grid>
            )}

            {/* Sidebar - mobile */}
            <Drawer
              anchor="left"
              open={sidebarOpen}
              onClose={toggleSidebar}
            >
              <Box sx={{ 
                width: 250,
                height: '100%',
                p: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  p: 1
                }}>
                  <Typography variant="h6">Navigation</Typography>
                  <IconButton onClick={toggleSidebar}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Sidebar 
                    onNavigate={(destination) => {
                      if (onNavigate) {
                        onNavigate(destination);
                      }
                      toggleSidebar();
                    }} 
                  />
                </Box>
              </Box>
            </Drawer>

            {/* Main workspace */}
            <Grid item xs={12} md={7} sx={{ height: '100%' }}>
              <MainWorkspace 
                panels={panels} 
                layout={layout}
                currentWorkspaceId={currentWorkspaceId}
              />
            </Grid>

            {/* Results area */}
            <Grid item xs={12} md={3} sx={{ height: '100%' }}>
              <ResultsArea results={results} />
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Create workspace dialog */}
      <Dialog 
        open={createWorkspaceOpen} 
        onClose={closeCreateWorkspaceDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Workspace Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newWorkspaceName}
            onChange={handleNewWorkspaceNameChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel id="layout-select-label">Layout</InputLabel>
            <Select
              labelId="layout-select-label"
              id="layout-select"
              value={newWorkspaceLayout}
              label="Layout"
              onChange={handleNewWorkspaceLayoutChange}
            >
              <MenuItem value="grid">Grid Layout</MenuItem>
              <MenuItem value="tabs">Tabs Layout</MenuItem>
              <MenuItem value="stack">Stack Layout</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateWorkspaceDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateWorkspace}
            variant="contained"
            disabled={!newWorkspaceName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default DashboardLayout;