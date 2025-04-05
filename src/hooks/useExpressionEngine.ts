import { useMemo, useRef, useEffect } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { ExpressionEngine } from '../core/expression-engine';
import { setCurrentExpression, startEvaluation, addResult } from '../store/slices/expressionSlice';

/**
 * Hook for using the expression engine in React components
 */
export const useExpressionEngine = () => {
  // Get Redux state and dispatch
  const dispatch = useAppDispatch();
  const { currentExpression, isEvaluating, history } = useAppSelector(
    (state) => state.expression
  );

  // Create a memoized expression engine instance
  const engineRef = useRef<ExpressionEngine | null>(null);
  
  if (engineRef.current === null) {
    engineRef.current = new ExpressionEngine();
  }
  
  // Memoize common operations
  const engine = useMemo(() => {
    return {
      // Parse and validate an expression
      parse: (expression: string) => {
        return engineRef.current!.parse(expression);
      },
      
      // Evaluate an expression and store result in Redux
      evaluate: (expression: string) => {
        dispatch(startEvaluation());
        
        const result = engineRef.current!.evaluate(expression);
        
        dispatch(addResult({
          expression,
          result: result.error ? `Error: ${result.error}` : String(result.value),
          error: result.error
        }));
        
        return result;
      },
      
      // Get syntax highlighting tokens
      highlightSyntax: (expression: string) => {
        return engineRef.current!.highlightSyntax(expression);
      },
      
      // Get HTML with syntax highlighting
      getHighlightedHtml: (expression: string) => {
        return engineRef.current!.renderHighlightedHtml(expression);
      },
      
      // Get auto-completion suggestions
      getSuggestions: (expression: string, cursorPosition: number) => {
        return engineRef.current!.getSuggestions(expression, cursorPosition);
      },
      
      // Update the current expression in Redux
      updateExpression: (expression: string) => {
        dispatch(setCurrentExpression(expression));
      }
    };
  }, [dispatch]);

  // Sync expression history with engine when the component mounts
  useEffect(() => {
    // This would ideally populate the engine history from Redux
    // but we're keeping the histories separate for now
  }, []);

  return {
    engine,
    currentExpression,
    isEvaluating,
    history
  };
};