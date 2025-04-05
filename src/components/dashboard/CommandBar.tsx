import { FC, useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Paper, TextField, InputAdornment, Box, List, ListItem, Typography } from '@mui/material';
import { useExpressionEngine } from '../../hooks/useExpressionEngine';
import { ExpressionSuggestion } from '../../core/expression-engine';

interface CommandBarProps {
  onExecute?: (command: string, result: string) => void;
}

const CommandBar: FC<CommandBarProps> = ({ onExecute }) => {
  const { engine, isEvaluating } = useExpressionEngine();
  const [expression, setExpression] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestions, setSuggestions] = useState<ExpressionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update syntax highlighting when expression changes
  useEffect(() => {
    // Get highlighted expression (we'll use this in a future implementation for richer UI)
    engine.getHighlightedHtml(expression);
    
    // Update suggestions based on current cursor position
    if (expression.trim().length > 0) {
      const newSuggestions = engine.getSuggestions(expression, cursorPosition);
      setSuggestions(newSuggestions.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestionIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [expression, cursorPosition, engine]);

  const handleExpressionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setExpression(event.target.value);
    setCursorPosition(event.target.selectionStart || 0);
    engine.updateExpression(event.target.value);
  };

  const handleExpressionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestion navigation
    if (showSuggestions && suggestions.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedSuggestionIndex((prevIndex) => 
            (prevIndex + 1) % suggestions.length
          );
          return;
          
        case 'ArrowUp':
          event.preventDefault();
          setSelectedSuggestionIndex((prevIndex) => 
            (prevIndex - 1 + suggestions.length) % suggestions.length
          );
          return;
          
        case 'Tab':
          event.preventDefault();
          applySuggestion(suggestions[selectedSuggestionIndex]);
          return;
          
        case 'Escape':
          setShowSuggestions(false);
          return;
      }
    }

    // Execute expression on Enter (unless Shift is held for multi-line)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      if (expression.trim()) {
        executeExpression();
      }
    } else if (event.key === 'Enter' && event.shiftKey) {
      // Allow multi-line input with Shift+Enter
    }
  };

  const applySuggestion = (suggestion: ExpressionSuggestion) => {
    // Find the word boundary at cursor position
    let wordStart = cursorPosition;
    while (wordStart > 0 && /[a-zA-Z0-9_]/.test(expression[wordStart - 1])) {
      wordStart--;
    }
    
    // Insert the suggestion
    const prefix = expression.substring(0, wordStart);
    const suffix = expression.substring(cursorPosition);
    const newExpression = prefix + suggestion.text + suffix;
    
    // Update state
    setExpression(newExpression);
    engine.updateExpression(newExpression);
    
    // Move cursor after the inserted suggestion
    const newCursorPosition = wordStart + suggestion.text.length;
    setCursorPosition(newCursorPosition);
    
    // Update input field cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
    
    // Hide suggestions
    setShowSuggestions(false);
  };

  const handleSelectionChange = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
  };

  const executeExpression = () => {
    if (isEvaluating) return;
    
    // Parse and check for errors
    const parseResult = engine.parse(expression);
    
    if (parseResult.errors.length > 0) {
      // Handle syntax errors
      console.error('Syntax errors:', parseResult.errors);
      
      // Evaluate anyway to get proper error in result
      const result = engine.evaluate(expression);
      
      if (onExecute) {
        onExecute(expression, result.error ? `Error: ${result.error}` : String(result.value));
      }
      
      return;
    }
    
    // Evaluate the expression
    const result = engine.evaluate(expression);
    
    // Execute callback
    if (onExecute) {
      onExecute(expression, result.error ? `Error: ${result.error}` : String(result.value));
    }
    
    // Clear the input
    setExpression('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 2,
          position: 'relative',
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Enter mathematical expression..."
          value={expression}
          onChange={handleExpressionChange}
          onKeyDown={handleExpressionKeyDown}
          onClick={handleSelectionChange}
          onSelect={handleSelectionChange}
          disabled={isEvaluating}
          inputRef={inputRef}
          InputProps={{
            sx: { 
              fontFamily: 'monospace',
              fontSize: '1rem',
              '& .MuiOutlinedInput-root': { borderRadius: 2 }
            },
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="body2" color="text.secondary">
                  &gt;
                </Typography>
              </InputAdornment>
            ),
          }}
        />
      </Paper>
      
      {/* Suggestions dropdown */}
      {showSuggestions && (
        <Paper
          elevation={5}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            mt: 0.5,
            maxHeight: '200px',
            overflow: 'auto',
          }}
        >
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={suggestion.text}
                onClick={() => applySuggestion(suggestion)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: index === selectedSuggestionIndex ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontFamily="monospace">
                    {suggestion.displayText}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {suggestion.description}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default CommandBar;