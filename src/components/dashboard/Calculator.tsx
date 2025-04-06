import { FC, useState, useCallback, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  TextField,
  IconButton,
  Divider,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Backspace as BackspaceIcon,
  Calculate as CalculateIcon,
  DeleteForever as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PriorityHigh as PrimeIcon,
  Functions as FunctionsIcon,
  Star as FactorizeIcon,
} from '@mui/icons-material';
import { useMathJs } from '../../hooks';

// Calculator modes
type CalculatorMode = 'basic' | 'scientific' | 'number-theory';

// Interface for displaying memory values
interface MemoryValue {
  id: string;
  value: string;
  description: string;
}

const Calculator: FC = () => {
  // State for the calculator
  const [display, setDisplay] = useState<string>('');
  const [secondaryDisplay, setSecondaryDisplay] = useState<string>('');
  const [memory, setMemory] = useState<MemoryValue[]>([]);
  const [showMemory, setShowMemory] = useState<boolean>(false);
  const [firstOperand, setFirstOperand] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetDisplayOnNextInput, setResetDisplayOnNextInput] = useState<boolean>(false);
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('basic');
  const [inputBase, setInputBase] = useState<number>(10);

  // Get the math-js integration hook
  const { 
    add, 
    subtract, 
    multiply, 
    divide,
    isPrime,
    factorize,
    gcd,
    lcm,
    loading,
    error 
  } = useMathJs();

  // Handle errors
  useEffect(() => {
    if (error) {
      setSecondaryDisplay(`Error: ${error.message}`);
    }
  }, [error]);

  // Handle digit input
  const handleDigitInput = useCallback((digit: string) => {
    if (resetDisplayOnNextInput) {
      setDisplay(digit);
      setResetDisplayOnNextInput(false);
    } else {
      setDisplay(prev => prev + digit);
    }
    setSecondaryDisplay('');
  }, [resetDisplayOnNextInput]);

  // Handle decimal point
  const handleDecimalPoint = useCallback(() => {
    if (resetDisplayOnNextInput) {
      setDisplay('0.');
      setResetDisplayOnNextInput(false);
    } else if (!display.includes('.')) {
      setDisplay(prev => prev === '' ? '0.' : prev + '.');
    }
  }, [display, resetDisplayOnNextInput]);

  // Clear display
  const handleClear = useCallback(() => {
    setDisplay('');
    setSecondaryDisplay('');
    setFirstOperand(null);
    setOperation(null);
  }, []);

  // Clear entry (current display only)
  const handleClearEntry = useCallback(() => {
    setDisplay('');
    setSecondaryDisplay('');
  }, []);

  // Backspace
  const handleBackspace = useCallback(() => {
    if (display.length > 0) {
      setDisplay(prev => prev.slice(0, -1));
    }
  }, [display]);

  // Toggle sign
  const handleToggleSign = useCallback(() => {
    if (display) {
      setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
    }
  }, [display]);

  // Function to perform calculation
  const performCalculation = useCallback(async (
    firstOp: string, 
    secondOp: string, 
    op: string
  ): Promise<string> => {
    try {
      switch (op) {
        case '+':
          return await add(firstOp, secondOp);
        case '-':
          return await subtract(firstOp, secondOp);
        case '×':
          return await multiply(firstOp, secondOp);
        case '÷':
          return await divide(firstOp, secondOp);
        case 'gcd':
          return await gcd(firstOp, secondOp);
        case 'lcm':
          return await lcm(firstOp, secondOp);
        default:
          throw new Error(`Unsupported operation: ${op}`);
      }
    } catch (err) {
      // Error handling is done via the useMathJs hook
      return "Error";
    }
  }, [add, subtract, multiply, divide, gcd, lcm]);

  // Handle equals 
  const handleEquals = useCallback(async () => {
    if (firstOperand !== null && operation !== null && display) {
      const result = await performCalculation(firstOperand, display, operation);
      
      // Update displays
      setSecondaryDisplay(`${firstOperand} ${operation} ${display} =`);
      setDisplay(result);
      
      // Reset operation state
      setFirstOperand(null);
      setOperation(null);
      setResetDisplayOnNextInput(true);
    }
  }, [firstOperand, operation, display, performCalculation]);

  // Handle operations (add, subtract, multiply, divide)
  const handleOperation = useCallback(async (op: string) => {
    if (display) {
      // If we already have a first operand and operation, calculate the result first
      if (firstOperand !== null && operation !== null) {
        const result = await performCalculation(firstOperand, display, operation);
        setDisplay(result);
      }
      
      setFirstOperand(display);
      setOperation(op);
      setSecondaryDisplay(`${display} ${op}`);
      setResetDisplayOnNextInput(true);
    }
  }, [display, firstOperand, operation, performCalculation]);

  // Check if a number is prime
  const handleCheckPrime = useCallback(async () => {
    if (display) {
      try {
        const result = await isPrime(display);
        setSecondaryDisplay(`isPrime(${display}) = ${result ? 'true' : 'false'}`);
      } catch (err) {
        // Error handling is done via the useMathJs hook
      }
    }
  }, [display, isPrime]);

  // Factorize a number
  const handleFactorize = useCallback(async () => {
    if (display) {
      try {
        const factors = await factorize(display);
        
        // Format factors as a string like 2^3 × 5^1 × 7^2
        const factorString = Object.entries(factors)
          .map(([prime, exponent]) => `${prime}${exponent > 1 ? `^${exponent}` : ''}`)
          .join(' × ');
        
        setSecondaryDisplay(`${display} = ${factorString}`);
      } catch (err) {
        // Error handling is done via the useMathJs hook
      }
    }
  }, [display, factorize]);

  // Greatest Common Divisor
  const handleGcd = useCallback(() => {
    handleOperation('gcd');
  }, [handleOperation]);

  // Least Common Multiple
  const handleLcm = useCallback(() => {
    handleOperation('lcm');
  }, [handleOperation]);

  // Save to memory
  const handleSaveToMemory = useCallback(() => {
    if (display) {
      const newMemoryItem: MemoryValue = {
        id: `mem-${Date.now()}`,
        value: display,
        description: secondaryDisplay || 'Stored value'
      };
      
      setMemory(prev => [...prev, newMemoryItem]);
      setShowMemory(true);
    }
  }, [display, secondaryDisplay]);

  // Recall from memory
  const handleRecallMemory = useCallback((value: string) => {
    setDisplay(value);
    setResetDisplayOnNextInput(false);
  }, []);

  // Clear memory
  const handleClearMemory = useCallback(() => {
    setMemory([]);
  }, []);

  // Handle calculator mode change
  const handleModeChange = useCallback((_: React.SyntheticEvent, newMode: CalculatorMode) => {
    setCalculatorMode(newMode);
  }, []);

  // Handle base conversion
  const handleBaseChange = useCallback((newBase: number) => {
    if (display) {
      // Convert current display to the new base
      try {
        // Parse the current display in the current base
        const decimal = parseInt(display, inputBase);
        
        // Convert to the new base
        const converted = decimal.toString(newBase).toUpperCase();
        
        setSecondaryDisplay(`Base ${inputBase} → Base ${newBase}: ${display} = ${converted}`);
        setDisplay(converted);
        setInputBase(newBase);
      } catch (err) {
        setSecondaryDisplay(`Error converting base`);
      }
    } else {
      setInputBase(newBase);
    }
  }, [display, inputBase]);

  // Render digit buttons based on current base
  const renderDigitButtons = () => {
    const digits = [];
    
    // For bases higher than 10, we need to add A-F buttons
    const maxDigit = Math.min(inputBase, 10);
    
    // Add digit buttons 0-9 or 0-(maxDigit-1)
    for (let i = 0; i < maxDigit; i++) {
      digits.push(
        <Grid item xs={4} key={i}>
          <Button 
            fullWidth 
            variant="outlined"
            onClick={() => handleDigitInput(i.toString())}
          >
            {i}
          </Button>
        </Grid>
      );
    }
    
    // For hexadecimal, add A-F buttons
    if (inputBase > 10) {
      for (let i = 0; i < inputBase - 10; i++) {
        const letter = String.fromCharCode(65 + i); // A=65, B=66, etc.
        if (i < 6) { // Only go up to F (base 16)
          digits.push(
            <Grid item xs={4} key={letter}>
              <Button 
                fullWidth 
                variant="outlined"
                onClick={() => handleDigitInput(letter)}
              >
                {letter}
              </Button>
            </Grid>
          );
        }
      }
    }
    
    return digits;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <CalculateIcon sx={{ mr: 1 }} /> Calculator
      </Typography>
      
      <Tabs 
        value={calculatorMode} 
        onChange={handleModeChange}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="Basic" value="basic" />
        <Tab label="Scientific" value="scientific" />
        <Tab label="Number Theory" value="number-theory" />
      </Tabs>
      
      <Box sx={{ mb: 2 }}>
        {/* Secondary display (shows operation or result info) */}
        <TextField
          fullWidth
          variant="outlined"
          value={secondaryDisplay}
          disabled
          size="small"
          sx={{ 
            mb: 1,
            '& .MuiInputBase-input': { 
              textAlign: 'right',
              fontFamily: 'monospace',
              color: 'text.secondary',
              fontSize: '0.875rem'
            }
          }}
        />
        
        {/* Main display */}
        <TextField
          fullWidth
          variant="outlined"
          value={display}
          disabled
          InputProps={{
            endAdornment: loading ? <CircularProgress size={20} /> : null,
          }}
          sx={{ 
            '& .MuiInputBase-input': { 
              textAlign: 'right',
              fontFamily: 'monospace',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }
          }}
        />
      </Box>
      
      {calculatorMode !== 'basic' && (
        <Box sx={{ mb: 2 }}>
          {calculatorMode === 'scientific' && (
            <Grid container spacing={1}>
              <Grid item xs={3}>
                <Tooltip title="Binary (Base 2)">
                  <Button
                    fullWidth
                    variant={inputBase === 2 ? "contained" : "outlined"}
                    onClick={() => handleBaseChange(2)}
                  >
                    BIN
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={3}>
                <Tooltip title="Octal (Base 8)">
                  <Button
                    fullWidth
                    variant={inputBase === 8 ? "contained" : "outlined"}
                    onClick={() => handleBaseChange(8)}
                  >
                    OCT
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={3}>
                <Tooltip title="Decimal (Base 10)">
                  <Button
                    fullWidth
                    variant={inputBase === 10 ? "contained" : "outlined"}
                    onClick={() => handleBaseChange(10)}
                  >
                    DEC
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={3}>
                <Tooltip title="Hexadecimal (Base 16)">
                  <Button
                    fullWidth
                    variant={inputBase === 16 ? "contained" : "outlined"}
                    onClick={() => handleBaseChange(16)}
                  >
                    HEX
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          )}
          
          {calculatorMode === 'number-theory' && (
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={handleCheckPrime}
                  startIcon={<PrimeIcon />}
                >
                  Is Prime?
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={handleFactorize}
                  startIcon={<FactorizeIcon />}
                >
                  Factorize
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={handleGcd}
                  startIcon={<FunctionsIcon />}
                >
                  GCD
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={handleLcm}
                  startIcon={<FunctionsIcon />}
                >
                  LCM
                </Button>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="error"
              onClick={handleClear}
            >
              C
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="error"
              onClick={handleClearEntry}
            >
              CE
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              fullWidth 
              variant="outlined"
              onClick={handleBackspace}
            >
              <BackspaceIcon fontSize="small" />
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary"
              onClick={() => handleOperation('÷')}
            >
              ÷
            </Button>
          </Grid>
        </Grid>
        
        <Grid container spacing={1}>
          {renderDigitButtons()}
          
          {/* Additional buttons */}
          <Grid item xs={4}>
            <Button 
              fullWidth 
              variant="outlined"
              onClick={handleDecimalPoint}
              disabled={inputBase !== 10} // Disable for non-decimal bases
            >
              .
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button 
              fullWidth 
              variant="outlined"
              onClick={handleToggleSign}
            >
              +/-
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button 
              fullWidth 
              variant="contained" 
              color="secondary"
              onClick={handleEquals}
            >
              =
            </Button>
          </Grid>
          
          {/* Operations */}
          <Grid item xs={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary"
              onClick={() => handleOperation('×')}
            >
              ×
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary"
              onClick={() => handleOperation('-')}
            >
              -
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary"
              onClick={() => handleOperation('+')}
            >
              +
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary"
              onClick={handleSaveToMemory}
            >
              M+
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* Memory section */}
      <Box sx={{ mt: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            py: 1
          }}
          onClick={() => setShowMemory(prev => !prev)}
        >
          <Typography variant="subtitle2">
            Memory ({memory.length})
          </Typography>
          <IconButton size="small">
            {showMemory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Divider />
        
        {showMemory && (
          <Box sx={{ mt: 1, maxHeight: '200px', overflowY: 'auto' }}>
            {memory.length > 0 ? (
              <Stack spacing={1}>
                {memory.map((item) => (
                  <Box 
                    key={item.id}
                    sx={{ 
                      p: 1, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {item.value}
                      </Typography>
                    </Box>
                    <Button 
                      size="small" 
                      onClick={() => handleRecallMemory(item.value)}
                    >
                      Recall
                    </Button>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No values in memory. Use M+ to store results.
              </Typography>
            )}
            
            {memory.length > 0 && (
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={handleClearMemory}
                startIcon={<ClearIcon />}
              >
                Clear Memory
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default Calculator;