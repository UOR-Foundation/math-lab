import { useCallback, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import { useAppDispatch } from './hooks/useAppDispatch';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Calculator from './components/dashboard/Calculator';
import Visualize from './components/dashboard/Visualize';
import Plugins from './components/dashboard/Plugins';
import Settings from './components/dashboard/Settings';
import { Panel } from './components/dashboard/MainWorkspace';
import { addPanel, setCurrentWorkspace } from './store/slices/workspaceSlice';
import type { RootState } from './store';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  // Get needed state from Redux
  const results = useAppSelector((state: RootState) => state.expression.history);
  const workspaces = useAppSelector((state: RootState) => state.workspace.workspaces);
  const currentWorkspaceId = useAppSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  
  const [_activePanel, setActivePanel] = useState<string | null>(null);
  
  // Set the active panel based on the current route when the app loads
  useEffect(() => {
    const path = location.pathname.substring(1);
    if (path && ['calculator', 'visualize', 'plugins', 'settings'].includes(path)) {
      setActivePanel(path);
      
      // If the panel doesn't exist in the current workspace, add it
      if (currentWorkspace && !currentWorkspace.panels.some(p => p.id === path)) {
        dispatch(addPanel({
          panel: {
            id: path,
            title: path.charAt(0).toUpperCase() + path.slice(1),
            type: path,
          }
        }));
      }
    } else {
      // Default to calculator if no route is specified
      navigate('/calculator');
    }
  }, [location.pathname, navigate, dispatch, currentWorkspace]);

  const handleCommandExecute = useCallback((command: string, result: string) => {
    // The expression has already been evaluated by the CommandBar component
    // using our expression engine. It also updates the Redux store.
    // We can handle any additional side effects here if needed.
    console.log(`Executed: ${command} = ${result}`);
    
    // Add calculator panel if it doesn't exist
    if (currentWorkspace && !currentWorkspace.panels.some(p => p.id === 'calculator')) {
      dispatch(addPanel({
        panel: {
          id: 'calculator',
          title: 'Calculator',
          type: 'calculator',
        }
      }));
    }
    
    // Navigate to calculator panel for calculation operations
    navigate('/calculator');
  }, [navigate, currentWorkspace, dispatch]);

  const handleNavigate = useCallback((destination: string) => {
    navigate(`/${destination}`);
    setActivePanel(destination);
    
    // Add the panel to the workspace if it doesn't exist
    if (currentWorkspace && !currentWorkspace.panels.some(p => p.id === destination)) {
      dispatch(addPanel({
        panel: {
          id: destination,
          title: destination.charAt(0).toUpperCase() + destination.slice(1),
          type: destination,
        }
      }));
    }
  }, [navigate, dispatch, currentWorkspace]);

  // Handle workspace change
  const handleWorkspaceChange = useCallback((workspaceId: string) => {
    dispatch(setCurrentWorkspace(workspaceId));
  }, [dispatch]);

  // Determine which panel component to render based on the panel type
  const getPanelComponent = (type: string) => {
    switch (type) {
      case 'calculator':
        return <Calculator />;
      case 'visualize':
        return <Visualize />;
      case 'plugins':
        return <Plugins />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  // Create panels from the workspace configuration
  const panels: Panel[] = currentWorkspace ? currentWorkspace.panels.map(panel => ({
    id: panel.id,
    title: panel.title,
    component: getPanelComponent(panel.type),
    position: panel.position ? {
      x: panel.position.x,
      y: panel.position.y,
      w: panel.position.w,
      h: panel.position.h,
    } : undefined,
    minimized: panel.position?.minimized,
    maximized: panel.position?.maximized,
  })) : [];

  return (
    <Routes>
      <Route 
        path="/*" 
        element={
          <DashboardLayout
            onCommandExecute={handleCommandExecute}
            onNavigate={handleNavigate}
            onWorkspaceChange={handleWorkspaceChange}
            results={results}
            panels={panels}
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId || undefined}
            layout={currentWorkspace?.layout.type || 'grid'}
          />
        } 
      />
    </Routes>
  );
};

export default App;