import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface PanelPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minimized?: boolean;
  maximized?: boolean;
}

export interface Panel {
  id: string;
  title: string;
  type: string;
  position: PanelPosition;
  active: boolean;
}

export interface Layout {
  id: string;
  name: string;
  type: 'grid' | 'tabs' | 'stack';
}

export interface Workspace {
  id: string;
  name: string;
  panels: Panel[];
  layout: Layout;
  active: boolean;
  createdAt: number;
  lastModified: number;
}

export interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  layouts: Layout[];
  defaultLayout: string;
}

const defaultLayouts: Layout[] = [
  {
    id: 'grid',
    name: 'Grid',
    type: 'grid',
  },
  {
    id: 'tabs',
    name: 'Tabs',
    type: 'tabs',
  },
  {
    id: 'stack',
    name: 'Stack',
    type: 'stack',
  },
];

const initialState: WorkspaceState = {
  workspaces: [
    {
      id: 'default',
      name: 'Default Workspace',
      active: true,
      panels: [],
      layout: defaultLayouts[0], // Grid layout by default
      createdAt: Date.now(),
      lastModified: Date.now(),
    },
  ],
  currentWorkspaceId: 'default',
  layouts: defaultLayouts,
  defaultLayout: 'grid',
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    // Switch the current workspace
    setCurrentWorkspace: (state, action: PayloadAction<string>) => {
      state.currentWorkspaceId = action.payload;
      
      // Mark all workspaces as inactive except the current one
      state.workspaces.forEach(workspace => {
        workspace.active = workspace.id === action.payload;
      });
    },
    
    // Create a new workspace
    createWorkspace: (state, action: PayloadAction<{ name: string; layout?: string }>) => {
      const now = Date.now();
      const newId = `workspace-${now}`;
      const layoutType = action.payload.layout || state.defaultLayout;
      const layoutConfig = state.layouts.find(l => l.id === layoutType) || state.layouts[0];
      
      state.workspaces.push({
        id: newId,
        name: action.payload.name,
        panels: [],
        layout: layoutConfig,
        active: false,
        createdAt: now,
        lastModified: now,
      });
    },
    
    // Delete a workspace
    deleteWorkspace: (state, action: PayloadAction<string>) => {
      // Don't delete the last workspace
      if (state.workspaces.length <= 1) {
        return;
      }
      
      // Remove the workspace
      state.workspaces = state.workspaces.filter(w => w.id !== action.payload);
      
      // If deleting the current workspace, switch to another one
      if (state.currentWorkspaceId === action.payload) {
        state.currentWorkspaceId = state.workspaces[0].id;
        state.workspaces[0].active = true;
      }
    },
    
    // Rename a workspace
    renameWorkspace: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const workspace = state.workspaces.find(w => w.id === action.payload.id);
      if (workspace) {
        workspace.name = action.payload.name;
        workspace.lastModified = Date.now();
      }
    },
    
    // Change workspace layout
    setWorkspaceLayout: (state, action: PayloadAction<{ id: string; layoutId: string }>) => {
      const workspace = state.workspaces.find(w => w.id === action.payload.id);
      const layout = state.layouts.find(l => l.id === action.payload.layoutId);
      
      if (workspace && layout) {
        workspace.layout = layout;
        workspace.lastModified = Date.now();
      }
    },
    
    // Add a panel to a workspace
    addPanel: (state, action: PayloadAction<{ 
      workspaceId?: string;
      panel: Omit<Panel, 'active' | 'position'> & { position?: Partial<PanelPosition> };
    }>) => {
      const workspaceId = action.payload.workspaceId || state.currentWorkspaceId;
      const workspace = state.workspaces.find(w => w.id === workspaceId);
      
      if (workspace) {
        // Create default position if not provided
        const defaultPosition = {
          x: 0,
          y: 0,
          w: 6,
          h: 8,
          minimized: false,
          maximized: false,
        };
        
        const position = {
          ...defaultPosition,
          ...action.payload.panel.position
        };
        
        // Add the panel
        workspace.panels.push({
          ...action.payload.panel,
          position,
          active: true,
          id: action.payload.panel.id || uuidv4(),
        });
        
        // Update modification time
        workspace.lastModified = Date.now();
      }
    },
    
    // Remove a panel from a workspace
    removePanel: (state, action: PayloadAction<string>) => {
      const workspace = state.workspaces.find(w => w.id === state.currentWorkspaceId);
      if (workspace) {
        workspace.panels = workspace.panels.filter(panel => panel.id !== action.payload);
        workspace.lastModified = Date.now();
      }
    },
    
    // Update a panel's position/size
    updatePanelPosition: (
      state,
      action: PayloadAction<{ 
        panelId: string; 
        position: Partial<PanelPosition>;
        workspaceId?: string;
      }>
    ) => {
      const workspaceId = action.payload.workspaceId || state.currentWorkspaceId;
      const workspace = state.workspaces.find(w => w.id === workspaceId);
      
      if (workspace) {
        const panel = workspace.panels.find(p => p.id === action.payload.panelId);
        if (panel) {
          panel.position = { ...panel.position, ...action.payload.position };
          workspace.lastModified = Date.now();
        }
      }
    },
    
    // Set panel active status
    setPanelActive: (
      state,
      action: PayloadAction<{ 
        panelId: string; 
        active: boolean;
        workspaceId?: string;
      }>
    ) => {
      const workspaceId = action.payload.workspaceId || state.currentWorkspaceId;
      const workspace = state.workspaces.find(w => w.id === workspaceId);
      
      if (workspace) {
        const panel = workspace.panels.find(p => p.id === action.payload.panelId);
        if (panel) {
          panel.active = action.payload.active;
          workspace.lastModified = Date.now();
        }
      }
    },
    
    // Duplicate a panel
    duplicatePanel: (
      state,
      action: PayloadAction<{ 
        panelId: string;
        workspaceId?: string;
      }>
    ) => {
      const workspaceId = action.payload.workspaceId || state.currentWorkspaceId;
      const workspace = state.workspaces.find(w => w.id === workspaceId);
      
      if (workspace) {
        const panel = workspace.panels.find(p => p.id === action.payload.panelId);
        if (panel) {
          // Create a copy with a new ID and slightly offset position
          const newPanel = {
            ...panel,
            id: uuidv4(),
            title: `${panel.title} (Copy)`,
            position: {
              ...panel.position,
              x: panel.position.x + 1,
              y: panel.position.y + 1,
            },
          };
          
          workspace.panels.push(newPanel);
          workspace.lastModified = Date.now();
        }
      }
    },
    
    // Clear all panels from a workspace
    clearWorkspace: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      const workspaceId = action.payload || state.currentWorkspaceId;
      const workspace = state.workspaces.find(w => w.id === workspaceId);
      
      if (workspace) {
        workspace.panels = [];
        workspace.lastModified = Date.now();
      }
    },
    
    // Import a workspace from exported data
    importWorkspace: (
      state,
      action: PayloadAction<Workspace>
    ) => {
      // Generate a new ID for the imported workspace
      const importedWorkspace = {
        ...action.payload,
        id: `workspace-${Date.now()}`,
        active: false,
        createdAt: Date.now(),
        lastModified: Date.now(),
      };
      
      state.workspaces.push(importedWorkspace);
    },
  },
});

export const {
  setCurrentWorkspace,
  createWorkspace,
  deleteWorkspace,
  renameWorkspace,
  setWorkspaceLayout,
  addPanel,
  removePanel,
  updatePanelPosition,
  setPanelActive,
  duplicatePanel,
  clearWorkspace,
  importWorkspace,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;