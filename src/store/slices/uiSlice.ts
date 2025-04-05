import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'system';
export type Layout = 'standard' | 'compact' | 'expanded';

interface UIState {
  sidebar: {
    isOpen: boolean;
    width: number;
  };
  theme: Theme;
  layout: Layout;
  commandBar: {
    isVisible: boolean;
    height: number;
  };
  resultsArea: {
    isVisible: boolean;
    height: number;
  };
  isLoading: boolean;
  notifications: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: number;
  }[];
}

const initialState: UIState = {
  sidebar: {
    isOpen: true,
    width: 250,
  },
  theme: 'system',
  layout: 'standard',
  commandBar: {
    isVisible: true,
    height: 60,
  },
  resultsArea: {
    isVisible: true,
    height: 200,
  },
  isLoading: false,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebar.width = action.payload;
    },
    
    // Theme actions
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    
    // Layout actions
    setLayout: (state, action: PayloadAction<Layout>) => {
      state.layout = action.payload;
    },
    
    // Command bar actions
    toggleCommandBar: (state) => {
      state.commandBar.isVisible = !state.commandBar.isVisible;
    },
    setCommandBarHeight: (state, action: PayloadAction<number>) => {
      state.commandBar.height = action.payload;
    },
    
    // Results area actions
    toggleResultsArea: (state) => {
      state.resultsArea.isVisible = !state.resultsArea.isVisible;
    },
    setResultsAreaHeight: (state, action: PayloadAction<number>) => {
      state.resultsArea.height = action.payload;
    },
    
    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Notification actions
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp'>>) => {
      const notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarWidth,
  setTheme,
  setLayout,
  toggleCommandBar,
  setCommandBarHeight,
  toggleResultsArea,
  setResultsAreaHeight,
  setLoading,
  addNotification,
  removeNotification,
  clearAllNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;