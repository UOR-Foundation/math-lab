import { FC, useState, useEffect } from 'react';
import { Paper, Box, Typography, IconButton, Stack, Tabs, Tab, Divider } from '@mui/material';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { removePanel, updatePanelPosition } from '../../store/slices/workspaceSlice';

// Panel type from our state model
export interface Panel {
  id: string;
  title: string;
  component: React.ReactNode;
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  minimized?: boolean;
  maximized?: boolean;
}

interface MainWorkspaceProps {
  panels?: Panel[];
  layout?: 'grid' | 'tabs' | 'stack';
  currentWorkspaceId?: string;
}

// Layout constants for the grid
const COLS = 12;
const ROW_HEIGHT = 30;
const MARGIN = [10, 10];

const MainWorkspace: FC<MainWorkspaceProps> = ({ 
  panels = [],
  layout = 'grid',
  currentWorkspaceId: _currentWorkspaceId
}) => {
  const dispatch = useAppDispatch();
//Remove this unused variable
  const [activeTab, setActiveTab] = useState(0);
  const [layouts, setLayouts] = useState<Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
  }>>([]);
  
  // Initialize layouts from panels
  useEffect(() => {
    if (panels.length > 0) {
      const newLayouts = panels.map((panel, index) => {
        // Use stored position or create default
        const pos = panel.position || {
          x: (index % 2) * 6, // alternate between left and right
          y: Math.floor(index / 2) * 4, // new row every 2 panels
          w: 6, // half width of grid
          h: 8, // reasonable starting height
        };
        
        return {
          i: panel.id,
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
          minW: 2,
          minH: 3,
          // Don't allow drag/resize if maximized
          isDraggable: !panel.maximized,
          isResizable: !panel.maximized,
          // Hide if minimized (handled in rendering)
        };
      });
      
      setLayouts(newLayouts);
    }
  }, [panels]);

  // Handle grid layout changes
  const handleLayoutChange = (newLayout: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>) => {
    newLayout.forEach(item => {
      const panelId = item.i;
      // Check if position has actually changed
      const panel = panels.find(p => p.id === panelId);
      if (panel && panel.position && (
        panel.position.x !== item.x ||
        panel.position.y !== item.y ||
        panel.position.w !== item.w ||
        panel.position.h !== item.h
      )) {
        // Update panel position in store
        dispatch(updatePanelPosition({
          panelId,
          position: {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h
          }
        }));
      }
    });
  };

  // Handle tab change for tab layout
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle panel close
  const handleClosePanel = (panelId: string) => {
    dispatch(removePanel(panelId));
  };

  // Handle panel minimize/maximize
  const handleMinimizePanel = (panelId: string) => {
    // Toggle minimized state
    const panel = panels.find(p => p.id === panelId);
    if (panel) {
      dispatch(updatePanelPosition({
        panelId,
        position: {
          ...(panel.position || { x: 0, y: 0, w: 6, h: 8 }),
          minimized: !(panel.minimized || false),
          maximized: false // Cannot be minimized and maximized at the same time
        }
      }));
    }
  };

  const handleMaximizePanel = (panelId: string) => {
    // Toggle maximized state
    const panel = panels.find(p => p.id === panelId);
    if (panel) {
      dispatch(updatePanelPosition({
        panelId,
        position: {
          ...(panel.position || { x: 0, y: 0, w: 6, h: 8 }),
          maximized: !(panel.maximized || false),
          minimized: false // Cannot be minimized and maximized at the same time
        }
      }));
    }
  };

  // Render different layouts based on the layout prop
  const renderLayoutContent = () => {
    if (panels.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary'
        }}>
          <Typography>No active panels. Select a tool from the sidebar.</Typography>
        </Box>
      );
    }

    switch (layout) {
      case 'tabs':
        return (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
            >
              {panels.map((panel, index) => (
                <Tab 
                  key={panel.id} 
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{panel.title}</Typography>
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        handleClosePanel(panel.id);
                      }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  } 
                  id={`panel-tab-${index}`}
                  aria-controls={`panel-tabpanel-${index}`}
                />
              ))}
            </Tabs>
            <Divider />
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {panels.map((panel, index) => (
                <Box
                  key={panel.id}
                  role="tabpanel"
                  hidden={activeTab !== index}
                  id={`panel-tabpanel-${index}`}
                  aria-labelledby={`panel-tab-${index}`}
                  sx={{ height: '100%' }}
                >
                  {activeTab === index && panel.component}
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 'stack':
        return (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto', p: 1 }}>
            {panels.map((panel) => (
              <Paper
                key={panel.id}
                elevation={2}
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    p: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    bgcolor: 'background.default',
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {panel.title}
                  </Typography>
                  <IconButton size="small" onClick={() => handleMinimizePanel(panel.id)}>
                    <MinimizeIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleMaximizePanel(panel.id)}>
                    <MaximizeIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleClosePanel(panel.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                {/* Hide content if minimized */}
                {!panel.minimized && (
                  <Box sx={{ p: 2, flexGrow: 1 }}>
                    {panel.component}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        );

      case 'grid':
      default:
        // Grid layout with draggable/resizable panels
        return (
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            overflow: 'auto',
            position: 'relative', // needed for absolute positioning of maximized panels
          }}>
            {/* Render maximized panel on top if any */}
            {panels.filter(p => p.maximized).map(panel => (
              <Paper
                key={`max-${panel.id}`}
                elevation={3}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    p: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    bgcolor: 'background.default',
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {panel.title}
                  </Typography>
                  <IconButton size="small" onClick={() => handleMaximizePanel(panel.id)}>
                    <MinimizeIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleClosePanel(panel.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                  {panel.component}
                </Box>
              </Paper>
            ))}

            {/* Grid layout for non-maximized panels */}
            {!panels.some(p => p.maximized) && layouts.length > 0 && (
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: layouts }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: COLS, md: COLS, sm: COLS, xs: 1, xxs: 1 }}
                rowHeight={ROW_HEIGHT}
                margin={MARGIN as [number, number]}
                containerPadding={[0, 0] as [number, number]}
                onLayoutChange={handleLayoutChange}
                isDraggable={true}
                isResizable={true}
                useCSSTransforms={true}
                compactType="vertical"
                preventCollision={false}
              >
                {panels.map((panel) => (
                  // Skip minimized panels in grid layout
                  !panel.minimized && (
                    <Paper
                      key={panel.id}
                      elevation={2}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        height: '100%',
                      }}
                    >
                      <Box 
                        sx={{ 
                          p: 1, 
                          display: 'flex', 
                          alignItems: 'center',
                          bgcolor: 'background.default',
                          borderBottom: 1,
                          borderColor: 'divider',
                          cursor: 'move',
                        }}
                        className="drag-handle" // drag handle class for react-grid-layout
                      >
                        <DragIndicatorIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                          {panel.title}
                        </Typography>
                        <IconButton size="small" onClick={() => handleMinimizePanel(panel.id)}>
                          <MinimizeIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleMaximizePanel(panel.id)}>
                          <MaximizeIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleClosePanel(panel.id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                        {panel.component}
                      </Box>
                    </Paper>
                  )
                ))}
              </ResponsiveGridLayout>
            )}
          </Box>
        );
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Important for inner scrollable areas
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6">
          Workspace
        </Typography>
        {/* Layout controls could go here */}
      </Box>
      
      {/* Main content area with panels */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {renderLayoutContent()}
      </Box>
    </Paper>
  );
};

export default MainWorkspace;