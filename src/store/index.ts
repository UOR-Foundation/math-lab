import { combineReducers, configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './slices/workspaceSlice';
import expressionReducer from './slices/expressionSlice';
import uiReducer from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';
import resultsReducer from './slices/resultsSlice';
import { 
  createPersistenceMiddleware, 
  persistenceReducerEnhancer,
  loadPersistedState
} from './middleware/persistenceMiddleware';
import { StorageLayer } from '../core/storage';

// Define persistence configuration
const persistConfig = {
  key: 'mathlab-state',
  // Whitelist approach - only these slices will be persisted
  whitelist: [
    'workspace',     // Persist workspace layouts and panels
    'expression',    // Persist expression history
    'settings',      // Persist user settings
    'results',       // Persist computation results
    'ui.theme',      // Persist theme preference
    'ui.layout',     // Persist layout preference
  ],
  // Use local storage (IndexedDB) for persistence
  storageLayer: StorageLayer.LOCAL,
};

// Create the root reducer
const rootReducer = combineReducers({
  workspace: workspaceReducer,
  expression: expressionReducer,
  ui: uiReducer,
  settings: settingsReducer,
  results: resultsReducer,
});

// Create persistence-enhanced reducer
const persistedReducer = persistenceReducerEnhancer(rootReducer);

// Load persisted state
const preloadedState = loadPersistedState(persistConfig);

// Create the Redux store
const store = configureStore({
  reducer: persistedReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      // Ignore non-serializable values in specific paths
      ignoredActions: ['REHYDRATE'],
      ignoredPaths: ['ui.notifications'],
    },
  }).concat(createPersistenceMiddleware(persistConfig)),
});

// Define the `RootState` type based on our combined reducer
export type RootState = {
  workspace: ReturnType<typeof workspaceReducer>;
  expression: ReturnType<typeof expressionReducer>;
  ui: ReturnType<typeof uiReducer>;
  settings: ReturnType<typeof settingsReducer>;
  results: ReturnType<typeof resultsReducer>;
};

// Define the `AppDispatch` type
export type AppDispatch = typeof store.dispatch;

export default store;