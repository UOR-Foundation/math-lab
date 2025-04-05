/**
 * Dashboard API Implementation
 * 
 * Provides the concrete implementation of the DashboardAPI interface
 * for use with the plugin system.
 */

import { DashboardAPI } from '../types';
import store from '../../../store';
import { addPanel } from '../../../store/slices/workspaceSlice';
import { addResult } from '../../../store/slices/resultsSlice';
import { setLoading, addNotification } from '../../../store/slices/uiSlice';

// Need to extend Panel with additional properties for plugins
interface ExtendedPanelProps {
  id: string;
  title: string;
  type: string;
  icon?: string;
  component?: unknown;
}

/**
 * Creates a dashboard API implementation that uses Redux
 * to communicate with the dashboard.
 */
export function createDashboardApiImpl(): DashboardAPI {
  return {
    registerTool: (tool) => {
      // Create a panel from the tool info
      store.dispatch(addPanel({
        panel: {
          id: tool.id,
          title: tool.name,
          type: 'tool',
        } as ExtendedPanelProps
      }));
    },

    registerPanel: (panel) => {
      store.dispatch(addPanel({
        panel: {
          id: panel.id,
          title: panel.id, // Use id as title if not provided
          type: 'custom-panel',
        } as ExtendedPanelProps
      }));
    },

    registerVisualization: (visualization) => {
      store.dispatch(addPanel({
        panel: {
          id: visualization.id,
          title: visualization.id, // Use id as title if not provided
          type: 'visualization',
        } as ExtendedPanelProps
      }));
    },

    showResult: (result) => {
      store.dispatch(addResult({
        value: result,
        timestamp: new Date().toISOString()
      }));
    },

    showError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      store.dispatch(addNotification({
        type: 'error',
        message: errorMessage
      }));
    },

    updateProgressBar: (progress) => {
      // Use loading state for now - in the future could implement a proper progress bar
      store.dispatch(setLoading(progress < 1));
    }
  };
}