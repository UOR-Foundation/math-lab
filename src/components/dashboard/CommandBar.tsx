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
  InputAdornment,
  Popper,
  ClickAwayListener,
  Fade
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';

interface CommandBarProps {
  compact?: boolean;
  onExecute?: (expression: string, result: string) => void;
}

/**
 * CommandBar component for entering and evaluating mathematical expressions
 */
const CommandBar: React.FC<CommandBarProps> = ({ 
  compact = false,
  onExecute
}) => {
  const dispatch = useAppDispatch();
  const [expression, setExpression] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
    if (event.target.value.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Execute on Enter
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleExecute();
    }
    
    // Cancel on Escape
    if (event.key === 'Escape') {
      if (isRunning) {
        event.preventDefault();
        cancel();
      } else if (showSuggestions) {
        event.preventDefault();
        setShowSuggestions(false);
      }
    }
  };
  
  // Handle execute button click
  const handleExecute = useCallback(() => {
    if (!parsedExpression?.ast || errors.length > 0 || !expression.trim()) {
      return;
    }
    
    execute(parsedExpression.ast)
      .then(computationResult => {
        // Add result to the store
        const resultValue = String(computationResult.value);
        dispatch(addResult({
          value: resultValue,
          timestamp: new Date().toISOString(),
          duration: computationResult.duration,
          metadata: { expression }
        }));
        
        // Notify parent component if callback provided
        if (onExecute) {
          onExecute(expression, resultValue);
        }
        
        // Clear expression if compact mode
        if (compact) {
          setExpression('');
        }
      })
      .catch(err => {
        console.error('Computation error:', err);
      });
  }, [parsedExpression, errors, execute, dispatch, expression, onExecute, compact]);
  
  // Handle cancel button click
  const handleCancel = () => {
    cancel('User cancelled');
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: ExpressionSuggestion) => {
    setExpression(prev => prev + suggestion.text);
    inputRef.current?.focus();
    setShowSuggestions(false);
  };
  
  // Focus input on component mount
  useEffect(() => {
    if (!compact) {
      inputRef.current?.focus();
    }
  }, [compact]);
  
  // Compact layout for toolbar
  if (compact) {
    return (
      <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
        <TextField
          size="small"
          placeholder="Calculate..."
          value={expression}
          onChange={handleExpressionChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (expression.trim()) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => setIsFocused(false)}
          inputRef={inputRef}
          sx={{
            width: '100%',
            '& .MuiInputBase-root': {
              borderRadius: 4,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {isRunning ? (
                  <IconButton onClick={handleCancel} color="error" size="small">
                    <StopIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton 
                    onClick={handleExecute} 
                    color="primary" 
                    size="small"
                    disabled={!parsedExpression?.ast || errors.length > 0 || !expression.trim()}
                  >
                    <PlayArrowIcon fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />
        
        {/* Suggestions popper for compact mode */}
        <Popper
          open={isFocused && showSuggestions && suggestions.length > 0}
          anchorEl={containerRef.current}
          placement="bottom-start"
          transition
          style={{ zIndex: 1300, width: containerRef.current?.clientWidth }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper 
                elevation={3}
                sx={{ 
                  mt: 0.5,
                  maxHeight: '300px', 
                  overflow: 'auto',
                  width: '100%'
                }}
              >
                <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
                  <Box>
                    {suggestions.map((suggestion: ExpressionSuggestion, index: number) => (
                      <Typography 
                        key={index} 
                        variant="body2"
                        sx={{ 
                          p: 1, 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' } 
                        }}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <strong>{suggestion.displayText}</strong>
                        {suggestion.description && ` - ${suggestion.description}`}
                      </Typography>
                    ))}
                  </Box>
                </ClickAwayListener>
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    );
  }
  
  // Full layout for main command bar
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
        
        <Box sx={{ position: 'relative' }} ref={containerRef}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter a mathematical expression..."
            value={expression}
            onChange={handleExpressionChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (expression.trim()) {
                setShowSuggestions(true);
              }
            }}
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
                      disabled={!parsedExpression?.ast || errors.length > 0 || !expression.trim()}
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
        {isFocused && showSuggestions && suggestions.length > 0 && (
          <Paper elevation={2} sx={{ mt: 1, p: 1, maxHeight: '200px', overflow: 'auto' }}>
            <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
              <Box>
                {suggestions.map((suggestion: ExpressionSuggestion, index: number) => (
                  <Typography 
                    key={index} 
                    variant="body2"
                    sx={{ 
                      p: 0.5, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' } 
                    }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <strong>{suggestion.displayText}</strong>
                    {suggestion.description && ` - ${suggestion.description}`}
                  </Typography>
                ))}
              </Box>
            </ClickAwayListener>
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