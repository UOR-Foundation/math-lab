import { useCallback, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Calculator from './components/dashboard/Calculator';
import Visualize from './components/dashboard/Visualize';
import Plugins from './components/dashboard/Plugins';
import Settings from './components/dashboard/Settings';
import type { RootState } from './store';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const results = useAppSelector((state: RootState) => state.expression.history);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  
  // Set the active panel based on the current route when the app loads
  useEffect(() => {
    const path = location.pathname.substring(1);
    if (path) {
      setActivePanel(path);
    } else {
      // Default to calculator if no route is specified
      navigate('/calculator');
    }
  }, [location.pathname, navigate]);

  const handleCommandExecute = useCallback((command: string, result: string) => {
    // The expression has already been evaluated by the CommandBar component
    // using our expression engine. It also updates the Redux store.
    // We can handle any additional side effects here if needed.
    console.log(`Executed: ${command} = ${result}`);
    
    // Example: Switch to calculator panel for calculation operations
    if (!activePanel || activePanel !== 'calculator') {
      navigate('/calculator');
    }
  }, [navigate, activePanel]);

  const handleNavigate = useCallback((destination: string) => {
    navigate(`/${destination}`);
    setActivePanel(destination);
  }, [navigate]);

  // Determine which panel to render based on the active panel state
  const renderPanel = () => {
    switch (activePanel) {
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

  const panels = activePanel ? [
    {
      id: activePanel,
      title: activePanel.charAt(0).toUpperCase() + activePanel.slice(1),
      component: renderPanel(),
    }
  ] : [];

  return (
    <Routes>
      <Route 
        path="/*" 
        element={
          <DashboardLayout
            onCommandExecute={handleCommandExecute}
            onNavigate={handleNavigate}
            results={results}
            panels={panels}
          />
        } 
      />
    </Routes>
  );
};

export default App;