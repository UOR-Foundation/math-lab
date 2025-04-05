import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define settings types
export type CalculationPrecision = 'standard' | 'high' | 'maximum';
export type NumberFormat = 'decimal' | 'scientific' | 'engineering' | 'fraction';
export type ResultsHistoryLimit = number;

interface SettingsState {
  calculation: {
    precision: CalculationPrecision;
    timeout: number; // in milliseconds
    autoEvaluate: boolean;
    workerCount: number;
  };
  display: {
    numberFormat: NumberFormat;
    decimalPlaces: number;
    useGrouping: boolean; // whether to use thousand separators
    resultsHistoryLimit: ResultsHistoryLimit;
  };
  storage: {
    persistHistory: boolean;
    autoSaveWorkspaces: boolean;
    backupFrequency: number; // in minutes, 0 means disabled
  };
  plugins: {
    enabledPlugins: string[]; // list of plugin IDs that are enabled
    pluginSettings: Record<string, Record<string, unknown>>; // plugin-specific settings
  };
}

const initialState: SettingsState = {
  calculation: {
    precision: 'standard',
    timeout: 30000, // 30 seconds
    autoEvaluate: false,
    workerCount: Math.max(2, navigator.hardwareConcurrency ? navigator.hardwareConcurrency - 1 : 2),
  },
  display: {
    numberFormat: 'decimal',
    decimalPlaces: 10,
    useGrouping: true,
    resultsHistoryLimit: 100,
  },
  storage: {
    persistHistory: true,
    autoSaveWorkspaces: true,
    backupFrequency: 0, // disabled by default
  },
  plugins: {
    enabledPlugins: [], // None enabled by default
    pluginSettings: {},
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Calculation settings
    setPrecision: (state, action: PayloadAction<CalculationPrecision>) => {
      state.calculation.precision = action.payload;
    },
    setTimeout: (state, action: PayloadAction<number>) => {
      state.calculation.timeout = action.payload;
    },
    setAutoEvaluate: (state, action: PayloadAction<boolean>) => {
      state.calculation.autoEvaluate = action.payload;
    },
    setWorkerCount: (state, action: PayloadAction<number>) => {
      state.calculation.workerCount = action.payload;
    },
    
    // Display settings
    setNumberFormat: (state, action: PayloadAction<NumberFormat>) => {
      state.display.numberFormat = action.payload;
    },
    setDecimalPlaces: (state, action: PayloadAction<number>) => {
      state.display.decimalPlaces = action.payload;
    },
    setUseGrouping: (state, action: PayloadAction<boolean>) => {
      state.display.useGrouping = action.payload;
    },
    setResultsHistoryLimit: (state, action: PayloadAction<ResultsHistoryLimit>) => {
      state.display.resultsHistoryLimit = action.payload;
    },
    
    // Storage settings
    setPersistHistory: (state, action: PayloadAction<boolean>) => {
      state.storage.persistHistory = action.payload;
    },
    setAutoSaveWorkspaces: (state, action: PayloadAction<boolean>) => {
      state.storage.autoSaveWorkspaces = action.payload;
    },
    setBackupFrequency: (state, action: PayloadAction<number>) => {
      state.storage.backupFrequency = action.payload;
    },
    
    // Plugin settings
    enablePlugin: (state, action: PayloadAction<string>) => {
      if (!state.plugins.enabledPlugins.includes(action.payload)) {
        state.plugins.enabledPlugins.push(action.payload);
      }
    },
    disablePlugin: (state, action: PayloadAction<string>) => {
      state.plugins.enabledPlugins = state.plugins.enabledPlugins.filter(
        (pluginId) => pluginId !== action.payload
      );
    },
    updatePluginSettings: (
      state,
      action: PayloadAction<{ pluginId: string; settings: Record<string, unknown> }>
    ) => {
      const { pluginId, settings } = action.payload;
      state.plugins.pluginSettings[pluginId] = {
        ...state.plugins.pluginSettings[pluginId],
        ...settings,
      };
    },
    
    // Reset all settings to defaults
    resetSettings: () => initialState,
  },
});

export const {
  setPrecision,
  setTimeout,
  setAutoEvaluate,
  setWorkerCount,
  setNumberFormat,
  setDecimalPlaces,
  setUseGrouping,
  setResultsHistoryLimit,
  setPersistHistory,
  setAutoSaveWorkspaces,
  setBackupFrequency,
  enablePlugin,
  disablePlugin,
  updatePluginSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;