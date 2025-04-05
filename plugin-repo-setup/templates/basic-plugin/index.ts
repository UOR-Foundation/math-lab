import MainPanel from './components/MainPanel';
import { calculateSquare } from './methods/calculations';

/**
 * Basic Plugin for Math Lab
 * 
 * This is a template plugin that demonstrates the basic structure and capabilities
 * of a Math Lab plugin.
 */
export default {
  /**
   * Plugin initialization function
   * Called when the plugin is loaded
   */
  initialize: async (dashboard, mathJs, config) => {
    console.log('Basic plugin initialized!');
    
    // You can set up event listeners, register callbacks, etc.
    dashboard.events.subscribe('expression:evaluated', (result) => {
      console.log('Expression evaluated:', result);
    });
    
    return { success: true };
  },
  
  /**
   * Plugin cleanup function
   * Called when the plugin is unloaded
   */
  cleanup: async () => {
    console.log('Basic plugin cleanup');
    
    // Clean up resources, remove event listeners, etc.
    
    return { success: true };
  },
  
  /**
   * UI Components exposed to dashboard
   */
  components: {
    panels: {
      'main-panel': MainPanel
    }
  },
  
  /**
   * Methods that extend math-js functionality
   */
  methods: {
    calculateSquare,
    
    // You can define methods directly here as well
    double: (value) => value * 2
  },
  
  /**
   * Event listeners
   */
  events: {
    'dashboard:computation-complete': (event) => {
      console.log('Computation complete:', event);
    }
  },
  
  /**
   * Public API for other plugins
   */
  api: {
    getVersion: () => '1.0.0',
    performCalculation: (value) => calculateSquare(value)
  }
};