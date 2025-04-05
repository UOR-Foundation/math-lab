/**
 * Basic Plugin Example
 * 
 * Example implementation of a basic plugin using the SDK
 */

import { PluginBase, type PluginContext } from '../plugin-base';
import { method, eventHandler, panel, visualization } from '../decorators';
import { PluginComponentProps, VisualizationComponentProps } from '../types';

/**
 * Basic example plugin implementation
 */
export class BasicExamplePlugin extends PluginBase {
  constructor() {
    super(
      'org.example.basic-plugin',
      {
        name: 'Basic Example Plugin',
        version: '1.0.0',
        description: 'A basic example plugin demonstrating the SDK',
        author: {
          name: 'UOR Foundation',
          email: 'plugins@uorfoundation.org',
          url: 'https://uorfoundation.org'
        },
        license: 'MIT',
        keywords: ['example', 'basic', 'tutorial'],
        permissions: ['storage']
      }
    );
  }
  
  /**
   * Initialize the plugin
   */
  async initialize(context: PluginContext): Promise<{ success: boolean; error?: string }> {
    console.log('Initializing Basic Example Plugin');
    
    try {
      // Store initial configuration in plugin storage
      await context.api.storage.setItem('initialized', true);
      await context.api.storage.setItem('initTime', new Date().toISOString());
      
      // Subscribe to events
      context.api.events.subscribe('dashboard:computation-complete', (event) => {
        console.log('Computation completed:', event);
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Clean up the plugin
   */
  async cleanup(): Promise<{ success: boolean; error?: string }> {
    console.log('Cleaning up Basic Example Plugin');
    return { success: true };
  }
  
  /**
   * Example plugin method
   */
  @method('factorial')
  calculateFactorial(context: PluginContext, n: number): number {
    if (n < 0) {
      throw new Error('Factorial is only defined for non-negative integers');
    }
    
    if (n === 0 || n === 1) {
      return 1;
    }
    
    // Show calculation in progress
    context.api.dashboard.updateProgressBar(0.5);
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    
    // Calculation completed
    context.api.dashboard.updateProgressBar(1);
    
    // Show result
    context.api.dashboard.showResult(result);
    
    return result;
  }
  
  /**
   * Example event handler
   */
  @eventHandler('dashboard:expression-evaluated')
  handleExpressionEvaluated(context: PluginContext, event: unknown): void {
    // Log the event
    console.log('Expression evaluated:', event);
    
    // Show notification
    context.api.ui.showNotification('Expression evaluated by Basic Example Plugin');
  }
  
  /**
   * Example panel component
   */
  @panel('basic-panel')
  BasicPanel = (props: PluginComponentProps) => {
    const { dashboard, storage, ui } = props;
    
    // Example of using panel props
    const handleClick = async () => {
      try {
        const initialized = await storage.getItem('initialized');
        const initTime = await storage.getItem('initTime');
        
        ui.showNotification(`Plugin initialized: ${initialized ? 'Yes' : 'No'}`);
        
        // Show result in dashboard
        dashboard.showResult({
          initialized,
          initTime,
          message: 'Basic panel component executed'
        });
      } catch (error) {
        dashboard.showError(error instanceof Error ? error : String(error));
      }
    };
    
    // Simple panel UI (would be a React component in a real plugin)
    return {
      type: 'div',
      props: {
        className: 'basic-panel',
        children: [
          {
            type: 'h2',
            props: { children: 'Basic Example Plugin Panel' }
          },
          {
            type: 'p',
            props: { children: 'This is a basic panel component from the example plugin.' }
          },
          {
            type: 'button',
            props: {
              onClick: handleClick,
              children: 'Check Initialization Status'
            }
          }
        ]
      }
    };
  };
  
  /**
   * Example visualization component
   */
  @visualization('basic-visualization')
  BasicVisualization = (props: VisualizationComponentProps) => {
    const { data, width, height, dashboard } = props;
    
    // Log the visualization properties
    console.log('Rendering visualization with data:', data);
    console.log(`Visualization dimensions: ${width}x${height}`);
    
    // Show the data in dashboard
    dashboard.showResult({
      type: 'visualization-info',
      dataPoints: Array.isArray(data) ? data.length : 0,
      dimensions: { width, height }
    });
    
    // Simple visualization (would be a React component in a real plugin)
    return {
      type: 'div',
      props: {
        className: 'basic-visualization',
        style: {
          width: `${width}px`,
          height: `${height}px`,
          border: '1px solid #ccc',
          padding: '16px'
        },
        children: [
          {
            type: 'h3',
            props: { children: 'Basic Visualization' }
          },
          {
            type: 'p',
            props: { children: `Rendering data with ${Array.isArray(data) ? data.length : 0} data points` }
          }
        ]
      }
    };
  };
}