import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Panel {
  id: string;
  title: string;
  type: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  active: boolean;
}

interface Workspace {
  id: string;
  name: string;
  panels: Panel[];
  active: boolean;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [
    {
      id: 'default',
      name: 'Default Workspace',
      active: true,
      panels: [],
    },
  ],
  currentWorkspaceId: 'default',
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    // Switch the current workspace
    setCurrentWorkspace: (state, action: PayloadAction<string>) => {
      state.currentWorkspaceId = action.payload;
    },
    
    // Create a new workspace
    createWorkspace: (state, action: PayloadAction<{ name: string }>) => {
      const newId = `workspace-${Date.now()}`;
      state.workspaces.push({
        id: newId,
        name: action.payload.name,
        panels: [],
        active: false,
      });
    },
    
    // Add a panel to the current workspace
    addPanel: (state, action: PayloadAction<Omit<Panel, 'active'>>) => {
      const workspace = state.workspaces.find(w => w.id === state.currentWorkspaceId);
      if (workspace) {
        workspace.panels.push({ ...action.payload, active: true });
      }
    },
    
    // Remove a panel from the current workspace
    removePanel: (state, action: PayloadAction<string>) => {
      const workspace = state.workspaces.find(w => w.id === state.currentWorkspaceId);
      if (workspace) {
        workspace.panels = workspace.panels.filter(panel => panel.id !== action.payload);
      }
    },
    
    // Update a panel's position/size
    updatePanelPosition: (
      state,
      action: PayloadAction<{ panelId: string; position: Partial<Panel['position']> }>
    ) => {
      const workspace = state.workspaces.find(w => w.id === state.currentWorkspaceId);
      if (workspace) {
        const panel = workspace.panels.find(p => p.id === action.payload.panelId);
        if (panel) {
          panel.position = { ...panel.position, ...action.payload.position };
        }
      }
    },
  },
});

export const {
  setCurrentWorkspace,
  createWorkspace,
  addPanel,
  removePanel,
  updatePanelPosition,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;