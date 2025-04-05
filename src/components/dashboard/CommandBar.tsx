import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useExpressionEngine } from '../../hooks/useExpressionEngine';
import { useComputation } from '../../hooks/useComputation';
import { TaskStatus } from '../../core/computation';
import { ExpressionSuggestion } from '../../core/expression-engine/types';
import { addResult } from '../../store/slices/resultsSlice';
import { 
  Box, 
  TextField, 
  IconButton, 
  Paper, 
  Typography, 
  LinearProgress,
  InputAdornment
} from '@mui/material';
// Mock icons for now due to missing dependency
const PlayArrowIcon = () => <span>▶</span>;
const StopIcon = () => <span>■</span>;
const HistoryIcon = () => <span>⋯</span>;

/**
 * CommandBar component for entering and evaluating mathematical expressions
 */
const CommandBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const [expression, setExpression] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get expression engine hooks for syntax highlighting, parsing, etc.
  const { 
    highlightedExpression, 
    suggestions, 
    parsedExpression,
    errors,
    parseExpression
  } = useExpressionEngine();
  
  // Get computation hook for evaluating expressions
  const {
    result,
    status,
    progress,
    error,
    execute,
    cancel,
    isRunning
  } = useComputation();
  
  // Parse expression when it changes
  useEffect(() => {
    parseExpression(expression);
  }, [expression, parseExpression]);
  
  // Handle expression change
  const handleExpressionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExpression(event.target.value);
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Execute on Enter
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleExecute();
    }
    
    // Cancel on Escape
    if (event.key === 'Escape' && isRunning) {
      event.preventDefault();
      cancel();
    }
  };
  
  // Handle execute button click
  const handleExecute = useCallback(() => {
    if (!parsedExpression?.ast || errors.length > 0) {
      return;
    }
    
    execute(parsedExpression.ast)
      .then(computationResult => {
        // Add result to the store
        dispatch(addResult({
          result: computationResult.value,
          timestamp: new Date().toISOString(),
          duration: computationResult.duration
        }));
      })
      .catch(err => {
        console.error('Computation error:', err);
      });
  }, [parsedExpression, errors, execute, dispatch]);
  
  // Handle cancel button click
  const handleCancel = () => {
    cancel('User cancelled');
  };
  
  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          border: isFocused ? '2px solid #4a90e2' : '2px solid transparent',
          transition: 'border-color 0.2s ease-in-out'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Command Bar
        </Typography>
        
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter a mathematical expression..."
            value={expression}
            onChange={handleExpressionChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            inputRef={inputRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isRunning ? (
                    <IconButton onClick={handleCancel} color="error" size="large">
                      <StopIcon />
                    </IconButton>
                  ) : (
                    <IconButton 
                      onClick={handleExecute} 
                      color="primary" 
                      size="large"
                      disabled={!parsedExpression?.ast || errors.length > 0}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  )}
                  <IconButton color="default" size="large">
                    <HistoryIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              fontFamily: 'monospace',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: errors.length > 0 ? 'error.main' : 'inherit',
                },
              },
            }}
          />
          
          {/* Syntax highlighting overlay (hidden but used for accessible screen readers) */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              pl: 2,
              fontFamily: 'monospace',
              overflow: 'hidden',
              '& span': {
                display: 'inline-block',
              },
            }}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlightedExpression }}
          />
        </Box>
        
        {/* Error messages */}
        {errors.length > 0 && (
          <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
            {errors[0].message}
          </Typography>
        )}
        
        {/* Suggestions */}
        {isFocused && suggestions.length > 0 && (
          <Paper sx={{ mt: 1, p: 1, maxHeight: '200px', overflow: 'auto' }}>
            {suggestions.map((suggestion: ExpressionSuggestion, index: number) => (
              <Typography 
                key={index} 
                variant="body2"
                sx={{ 
                  p: 0.5, 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' } 
                }}
                onClick={() => {
                  setExpression(prev => prev + suggestion.text);
                  inputRef.current?.focus();
                }}
              >
                <strong>{suggestion.displayText}</strong>
                {suggestion.description && ` - ${suggestion.description}`}
              </Typography>
            ))}
          </Paper>
        )}
        
        {/* Computation progress */}
        {status === TaskStatus.RUNNING && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={progress * 100} />
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
              {Math.round(progress * 100)}%
            </Typography>
          </Box>
        )}
        
        {/* Computation result */}
        {result && status === TaskStatus.COMPLETED && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            = {String(result.value)}
            <Typography variant="caption" sx={{ ml: 1 }}>
              ({result.duration}ms)
            </Typography>
          </Typography>
        )}
        
        {/* Computation error */}
        {error && status === TaskStatus.FAILED && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default CommandBar;