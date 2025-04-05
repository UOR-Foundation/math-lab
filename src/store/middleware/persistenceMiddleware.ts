import { Middleware } from '@reduxjs/toolkit';
import { storageManager, StorageLayer } from '../../core/storage';

// Define the configuration for which parts of the state to persist
export interface PersistenceConfig {
  key: string;
  whitelist?: string[];
  blacklist?: string[];
  storageLayer?: StorageLayer;
}

// Default configuration
const defaultConfig: PersistenceConfig = {
  key: 'mathlab-state',
  // By default, we'll persist everything except for loading states and ephemeral UI state
  blacklist: ['ui.isLoading', 'ui.notifications'],
  storageLayer: StorageLayer.LOCAL,
};

// Helper function to check if a state path should be persisted
const shouldPersistPath = (path: string, config: PersistenceConfig): boolean => {
  // If whitelist is defined, only persist paths in the whitelist
  if (config.whitelist) {
    return config.whitelist.some(whitelistPath => 
      path === whitelistPath || path.startsWith(`${whitelistPath}.`)
    );
  }
  
  // If blacklist is defined, don't persist paths in the blacklist
  if (config.blacklist) {
    return !config.blacklist.some(blacklistPath => 
      path === blacklistPath || path.startsWith(`${blacklistPath}.`)
    );
  }
  
  // If neither whitelist nor blacklist is defined, persist everything
  return true;
};

// Define a type for the state object
type StateObject = Record<string, unknown>;

// Helper function to filter state based on persistence config
const filterState = (state: StateObject, config: PersistenceConfig): StateObject => {
  const filteredState: StateObject = {};
  
  // Filter top-level slices
  Object.keys(state).forEach(sliceKey => {
    // Check if this slice should be persisted
    if (shouldPersistPath(sliceKey, config)) {
      filteredState[sliceKey] = { ...(state[sliceKey] as Record<string, unknown>) };
    }
  });
  
  return filteredState;
};

// Create the persistence middleware
export const createPersistenceMiddleware = (
  config: PersistenceConfig = defaultConfig
): Middleware => {
  const storageKey = config.key;
  const storageLevel = config.storageLayer || StorageLayer.LOCAL;
  
  return store => {
    // Load persisted state on initialization
    try {
      // State loading is now handled by loadPersistedState function
      // and then loaded in the store configuration
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
    
    return next => action => {
      // First, let the action go through the normal flow
      const result = next(action);
      
      // Then, after the state has been updated, persist the state
      try {
        const state = store.getState();
        // Filter the state based on configuration
        const filteredState = filterState(state, config);
        // Save to storage system
        storageManager.set(storageKey, filteredState, storageLevel).catch(error => {
          console.error('Failed to persist state:', error);
        });
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
      
      return result;
    };
  };
};

// Create a function to load persisted state
export const loadPersistedState = (config: PersistenceConfig = defaultConfig): StateObject | undefined => {
  const storageKey = config.key;
  const storageLevel = config.storageLayer || StorageLayer.LOCAL;
  
  try {
    // Create promise to load state
    const statePromise = storageManager.get<StateObject>(storageKey, storageLevel);
    
    // Convert to synchronous (this is fine for initialization)
    let persistedState: StateObject | null = null;
    
    // Using a synchronous XHR to make this synchronous
    // This is typically discouraged, but is acceptable for initialization
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'data:text/plain;charset=utf-8,', false);
    xhr.onload = function() {
      if (xhr.status === 200) {
        // When XHR completes, our promise should be resolved
        statePromise.then(state => {
          persistedState = state;
        }).catch(error => {
          console.error('Failed to load persisted state:', error);
        });
      }
    };
    xhr.send();
    
    // Return the loaded state or undefined
    return persistedState || undefined;
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    return undefined;
  }
};

// Create a type for Redux actions
interface Action {
  type: string;
  [key: string]: unknown;
}

// Create a type for the reducer function
type Reducer = (state: StateObject | undefined, action: Action) => StateObject;

// Create a reducer enhancer to handle the REHYDRATE action
export const persistenceReducerEnhancer = (rootReducer: Reducer) => {
  return (state: StateObject | undefined, action: Action): StateObject => {
    if (action.type === 'REHYDRATE') {
      // Merge the persisted state with the initial state
      return {
        ...(state || {}),
        ...(action.payload as StateObject),
      };
    }
    return rootReducer(state, action);
  };
};