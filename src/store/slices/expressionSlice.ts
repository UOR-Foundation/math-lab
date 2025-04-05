import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExpressionResult {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  error?: string;
}

interface ExpressionState {
  history: ExpressionResult[];
  currentExpression: string;
  isEvaluating: boolean;
}

const initialState: ExpressionState = {
  history: [],
  currentExpression: '',
  isEvaluating: false,
};

const expressionSlice = createSlice({
  name: 'expression',
  initialState,
  reducers: {
    // Set the current expression
    setCurrentExpression: (state, action: PayloadAction<string>) => {
      state.currentExpression = action.payload;
    },
    
    // Start evaluation
    startEvaluation: (state) => {
      state.isEvaluating = true;
    },
    
    // Add a result to history
    addResult: (state, action: PayloadAction<Omit<ExpressionResult, 'id' | 'timestamp'>>) => {
      const newResult = {
        ...action.payload,
        id: `result-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
      };
      state.history.unshift(newResult); // Add to the beginning of the array
      state.isEvaluating = false;
      state.currentExpression = ''; // Clear the current expression
    },
    
    // Clear history
    clearHistory: (state) => {
      state.history = [];
    },
    
    // Remove a specific result from history
    removeResult: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(result => result.id !== action.payload);
    },
  },
});

export const {
  setCurrentExpression,
  startEvaluation,
  addResult,
  clearHistory,
  removeResult,
} = expressionSlice.actions;

export default expressionSlice.reducer;