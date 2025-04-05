import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ResultData {
  id: string;
  type: string;
  value: unknown;
  metadata: Record<string, unknown>;
}

export interface ResultsState {
  activeResults: ResultData[];
  pinnedResults: ResultData[];
  selectedResultId: string | null;
}

const initialState: ResultsState = {
  activeResults: [],
  pinnedResults: [],
  selectedResultId: null,
};

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    // Add a new result
    addResult: (state, action: PayloadAction<Omit<ResultData, 'id'>>) => {
      const newResult = {
        ...action.payload,
        id: `result-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };
      state.activeResults.push(newResult);
      state.selectedResultId = newResult.id;
    },
    
    // Remove a result
    removeResult: (state, action: PayloadAction<string>) => {
      state.activeResults = state.activeResults.filter(result => result.id !== action.payload);
      if (state.selectedResultId === action.payload) {
        state.selectedResultId = state.activeResults.length > 0 
          ? state.activeResults[state.activeResults.length - 1].id 
          : null;
      }
    },
    
    // Pin a result
    pinResult: (state, action: PayloadAction<string>) => {
      const resultIndex = state.activeResults.findIndex(result => result.id === action.payload);
      if (resultIndex !== -1) {
        const result = state.activeResults[resultIndex];
        state.pinnedResults.push(result);
      }
    },
    
    // Unpin a result
    unpinResult: (state, action: PayloadAction<string>) => {
      state.pinnedResults = state.pinnedResults.filter(result => result.id !== action.payload);
    },
    
    // Select a result
    selectResult: (state, action: PayloadAction<string>) => {
      state.selectedResultId = action.payload;
    },
    
    // Clear all active results
    clearActiveResults: (state) => {
      state.activeResults = [];
      state.selectedResultId = null;
    },
    
    // Clear all pinned results
    clearPinnedResults: (state) => {
      state.pinnedResults = [];
    },
    
    // Update result metadata
    updateResultMetadata: (
      state, 
      action: PayloadAction<{ id: string; metadata: Partial<ResultData['metadata']> }>
    ) => {
      const { id, metadata } = action.payload;
      const activeResult = state.activeResults.find(result => result.id === id);
      if (activeResult) {
        activeResult.metadata = { ...activeResult.metadata, ...metadata };
      }
      
      const pinnedResult = state.pinnedResults.find(result => result.id === id);
      if (pinnedResult) {
        pinnedResult.metadata = { ...pinnedResult.metadata, ...metadata };
      }
    },
  },
});

export const {
  addResult,
  removeResult,
  pinResult,
  unpinResult,
  selectResult,
  clearActiveResults,
  clearPinnedResults,
  updateResultMetadata,
} = resultsSlice.actions;

export default resultsSlice.reducer;