/**
 * Number Theory Plugin Example
 * 
 * Example implementation of a number theory plugin using the SDK
 */

import { PluginBase, type PluginContext } from '../plugin-base';
import { method, eventHandler, panel, visualization } from '../decorators';
import { PluginComponentProps, VisualizationComponentProps } from '../types';

/**
 * Number Theory example plugin implementation
 */
export class NumberTheoryPlugin extends PluginBase {
  constructor() {
    super(
      'org.example.number-theory',
      {
        name: 'Number Theory Tools',
        version: '1.0.0',
        description: 'A collection of number theory tools and visualizations',
        author: {
          name: 'UOR Foundation',
          email: 'plugins@uorfoundation.org',
          url: 'https://uorfoundation.org'
        },
        license: 'MIT',
        keywords: ['number-theory', 'primes', 'factorization', 'mathematics'],
        permissions: ['storage', 'computation.intensive']
      }
    );
  }
  
  /**
   * Initialize the plugin
   */
  async initialize(context: PluginContext): Promise<{ success: boolean; error?: string }> {
    console.log('Initializing Number Theory Plugin');
    
    try {
      // Cache setup
      await context.api.storage.setItem('primeCache', {});
      
      // Subscribe to relevant events
      context.api.events.subscribe('dashboard:number-input', (event) => {
        const { value } = event as { value: number };
        if (value > 0 && Number.isInteger(value)) {
          // Automatically check if prime for every number input
          this.isPrime(context, value);
        }
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
    console.log('Cleaning up Number Theory Plugin');
    return { success: true };
  }
  
  /**
   * Check if a number is prime
   */
  @method('isPrime')
  async isPrime(context: PluginContext, n: number): Promise<boolean> {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    
    // Try to get from cache first
    try {
      const primeCache = await context.api.storage.getItem('primeCache') as Record<number, boolean>;
      if (primeCache && primeCache[n] !== undefined) {
        return primeCache[n];
      }
    } catch (error) {
      console.error('Cache access error:', error);
    }
    
    // Show calculation in progress
    context.api.dashboard.updateProgressBar(0.2);
    
    let i = 5;
    const limit = Math.sqrt(n);
    
    // Show calculation progress
    let progressCheckpoint = 0;
    const progressStep = Math.ceil(limit / 5); // Update progress 5 times
    
    while (i <= limit) {
      if (n % i === 0 || n % (i + 2) === 0) {
        // Update cache
        try {
          const primeCache = await context.api.storage.getItem('primeCache') as Record<number, boolean>;
          await context.api.storage.setItem('primeCache', {
            ...primeCache,
            [n]: false
          });
        } catch (error) {
          console.error('Cache update error:', error);
        }
        
        // Calculation complete
        context.api.dashboard.updateProgressBar(1);
        return false;
      }
      
      i += 6;
      
      // Update progress
      if (i > progressCheckpoint) {
        progressCheckpoint += progressStep;
        context.api.dashboard.updateProgressBar(0.2 + 0.6 * (i / limit));
      }
    }
    
    // Update cache
    try {
      const primeCache = await context.api.storage.getItem('primeCache') as Record<number, boolean>;
      await context.api.storage.setItem('primeCache', {
        ...primeCache,
        [n]: true
      });
    } catch (error) {
      console.error('Cache update error:', error);
    }
    
    // Calculation complete
    context.api.dashboard.updateProgressBar(1);
    return true;
  }
  
  /**
   * Find prime factors of a number
   */
  @method('primeFactors')
  async primeFactors(context: PluginContext, n: number): Promise<number[]> {
    if (n <= 1) return [];
    
    const factors: number[] = [];
    let num = n;
    
    // Show calculation in progress
    context.api.dashboard.updateProgressBar(0.1);
    
    // Extract factors of 2
    while (num % 2 === 0) {
      factors.push(2);
      num /= 2;
    }
    
    // Progress update
    context.api.dashboard.updateProgressBar(0.2);
    
    // Extract odd factors
    for (let i = 3; i <= Math.sqrt(num); i += 2) {
      while (num % i === 0) {
        factors.push(i);
        num /= i;
      }
      
      // Update progress periodically
      if (i % 100 === 1) {
        context.api.dashboard.updateProgressBar(0.2 + 0.7 * (i / Math.sqrt(n)));
      }
    }
    
    // If num is a prime number greater than 2
    if (num > 2) {
      factors.push(num);
    }
    
    // Calculation complete
    context.api.dashboard.updateProgressBar(1);
    
    // Show result
    context.api.dashboard.showResult({
      value: n,
      primeFactors: factors,
      factorization: factors.join(' × ')
    });
    
    return factors;
  }
  
  /**
   * Find the greatest common divisor of two numbers
   */
  @method('gcd')
  gcd(context: PluginContext, a: number, b: number): number {
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      throw new Error('GCD is only defined for integers');
    }
    
    a = Math.abs(a);
    b = Math.abs(b);
    
    // Euclidean algorithm
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    
    context.api.dashboard.showResult({
      operation: 'gcd',
      result: a
    });
    
    return a;
  }
  
  /**
   * Find the least common multiple of two numbers
   */
  @method('lcm')
  lcm(context: PluginContext, a: number, b: number): number {
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      throw new Error('LCM is only defined for integers');
    }
    
    if (a === 0 || b === 0) {
      return 0;
    }
    
    // Use the GCD to find the LCM
    const gcdValue = this.gcd(context, a, b);
    const lcmValue = Math.abs(a * b) / gcdValue;
    
    context.api.dashboard.showResult({
      operation: 'lcm',
      result: lcmValue
    });
    
    return lcmValue;
  }
  
  /**
   * Handler for calculation events
   */
  @eventHandler('dashboard:calculation-complete')
  handleCalculationComplete(context: PluginContext, event: unknown): void {
    const { result } = event as { result: number; expression: string };
    
    // Only process if the result is a positive integer
    if (Number.isInteger(result) && result > 0) {
      // Suggest number theory operations
      context.api.ui.showNotification(
        `Number Theory Tools available for ${result}`,
        { type: 'info', duration: 5000 }
      );
    }
  }
  
  /**
   * Number Theory Panel Component
   */
  @panel('number-theory-panel')
  NumberTheoryPanel = (props: PluginComponentProps) => {
    const { ui } = props;
    
    // Example handlers
    const analyzePrimeFactors = async () => {
      ui.showModal('Prime Factorization', {
        content: 'Enter a number to factorize:',
        inputType: 'number',
        onSubmit: (value: number) => {
          this.primeFactors({ api: props, config: {} }, value);
        }
      });
    };
    
    const checkPrime = async () => {
      ui.showModal('Primality Test', {
        content: 'Enter a number to check if it is prime:',
        inputType: 'number',
        onSubmit: (value: number) => {
          this.isPrime({ api: props, config: {} }, value);
        }
      });
    };
    
    // Simple panel UI (would be a React component in a real plugin)
    return {
      type: 'div',
      props: {
        className: 'number-theory-panel',
        children: [
          {
            type: 'h2',
            props: { children: 'Number Theory Tools' }
          },
          {
            type: 'div',
            props: {
              className: 'button-group',
              children: [
                {
                  type: 'button',
                  props: {
                    onClick: checkPrime,
                    children: 'Primality Test'
                  }
                },
                {
                  type: 'button',
                  props: {
                    onClick: analyzePrimeFactors,
                    children: 'Prime Factorization'
                  }
                }
              ]
            }
          }
        ]
      }
    };
  };
  
  /**
   * Prime Factorization Visualization
   */
  @visualization('prime-factorization-viz')
  PrimeFactorizationViz = (props: VisualizationComponentProps) => {
    const { data, width, height } = props;
    
    // Check if data contains prime factors
    const primeFactors = Array.isArray(data) ? data : [];
    
    // Simple visualization (would be a React component with D3.js in a real plugin)
    return {
      type: 'div',
      props: {
        className: 'prime-factorization-viz',
        style: {
          width: `${width}px`,
          height: `${height}px`,
          border: '1px solid #ccc',
          padding: '16px'
        },
        children: [
          {
            type: 'h3',
            props: { children: 'Prime Factorization Visualization' }
          },
          {
            type: 'div',
            props: {
              className: 'factor-tree',
              children: [
                {
                  type: 'p',
                  props: { children: `Factors: ${primeFactors.join(' × ')}` }
                }
              ]
            }
          }
        ]
      }
    };
  };
}