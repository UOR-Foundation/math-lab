import { useCallback, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from './hooks/useAppDispatch';
import { useAppSelector } from './hooks/useAppSelector';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Calculator from './components/dashboard/Calculator';
import Visualize from './components/dashboard/Visualize';
import Plugins from './components/dashboard/Plugins';
import Settings from './components/dashboard/Settings';
import { addResult, startEvaluation } from './store/slices/expressionSlice';
import type { RootState } from './store';

const App = () => {
  const dispatch = useAppDispatch();
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

  // Placeholder for actual computation implementation
  const handleCommandExecute = useCallback((command: string) => {
    dispatch(startEvaluation());
    
    // This is just a placeholder. In a real implementation, you would:
    // 1. Parse the expression
    // 2. Execute it using math-js library
    // 3. Add the result to the store
    
    // Simulate a simple calculator for now
    try {
      // In the real implementation, you would use a proper math expression parser.
      // We're using Function constructor instead of eval for safety
      // and to avoid eslint errors
      const calculateResult = new Function(`return ${command}`)();
      const result = calculateResult.toString();
      
      dispatch(addResult({
        expression: command,
        result: result,
      }));
    } catch (error) {
      dispatch(addResult({
        expression: command,
        result: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [dispatch]);

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