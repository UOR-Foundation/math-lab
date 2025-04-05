// Core type definitions for the application

// App state related types
export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

// Plugin related types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
}

// Expression related types
export interface Expression {
  id: string;
  value: string;
  result?: unknown;
  error?: string;
  timestamp: number;
}
