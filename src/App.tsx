import { useCallback } from 'react';
import { useAppDispatch } from './hooks/useAppDispatch';
import { useAppSelector } from './hooks/useAppSelector';
import DashboardLayout from './components/dashboard/DashboardLayout';
import { addResult, startEvaluation } from './store/slices/expressionSlice';
import { RootState } from './store';

const App = () => {
  const dispatch = useAppDispatch();
  const results = useAppSelector((state: RootState) => state.expression.history);
  
  // We're not using panels yet but will in the future
  // const panels = useAppSelector((state: RootState) => {
  //   const currentWorkspace = state.workspace.workspaces.find(
  //     (w) => w.id === state.workspace.currentWorkspaceId
  //   );
  //   return currentWorkspace ? currentWorkspace.panels : [];
  // });

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
    // This would typically update the current view or active panel
    console.log(`Navigating to: ${destination}`);
  }, []);

  return (
    <DashboardLayout
      onCommandExecute={handleCommandExecute}
      onNavigate={handleNavigate}
      results={results}
      panels={[]} // We'll populate this with actual panels later
    />
  );
};

export default App;