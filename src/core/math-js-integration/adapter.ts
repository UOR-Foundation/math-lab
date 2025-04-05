/**
 * Adapter for UOR Foundation math-js library
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { UniversalNumber, PrimeMath, configure as mathJsConfigure } from 'uor-foundation-math-js';
import { MathJsConfig, defaultConfig, UniversalNumberOptions, MathError, MathErrorType } from './types';
import { OperationCache } from './cache';

/**
 * Math-JS Adapter for integrating with the UOR Foundation's math-js library
 */
export class MathJsAdapter {
  private config: MathJsConfig;
  private cache: OperationCache;
  private workerPath: string;
  private static instance: MathJsAdapter;
  
  /**
   * Create a new math-js adapter
   * @param config - Configuration options
   * @param workerPath - Path to the math-js worker
   */
  private constructor(config: Partial<MathJsConfig> = {}, workerPath: string = '/src/workers/math-js-worker.js') {
    this.config = {
      ...defaultConfig,
      ...config
    };
    
    // Initialize the cache
    this.cache = new OperationCache(
      this.config.cache.maxSize,
      this.config.cache.enabled
    );
    
    // Store worker path
    this.workerPath = workerPath;
    
    // Configure the math-js library
    this.applyConfiguration();
  }
  
  /**
   * Get the singleton instance of the adapter
   * @param config - Configuration options
   * @param workerPath - Path to the math-js worker
   * @returns The MathJsAdapter instance
   */
  public static getInstance(config: Partial<MathJsConfig> = {}, workerPath?: string): MathJsAdapter {
    if (!MathJsAdapter.instance) {
      MathJsAdapter.instance = new MathJsAdapter(config, workerPath);
    } else if (Object.keys(config).length > 0) {
      // Update configuration if provided
      MathJsAdapter.instance.updateConfiguration(config);
    }
    
    return MathJsAdapter.instance;
  }
  
  /**
   * Apply configuration to the math-js library
   */
  private applyConfiguration(): void {
    // Apply configuration to the math-js library
    mathJsConfigure({
      performanceProfile: this.config.performanceProfile,
      factorization: this.config.factorization,
      cache: {
        enabled: this.config.cache.enabled,
        maxSize: this.config.cache.maxSize
      }
    });
  }
  
  /**
   * Update the configuration
   * @param config - New configuration values
   */
  public updateConfiguration(config: Partial<MathJsConfig>): void {
    // Merge configurations
    this.config = {
      ...this.config,
      ...config,
      factorization: {
        ...this.config.factorization,
        ...config.factorization
      },
      cache: {
        ...this.config.cache,
        ...config.cache
      }
    };
    
    // Update cache settings
    if (config.cache) {
      if (config.cache.enabled !== undefined) {
        config.cache.enabled ? this.cache.enable() : this.cache.disable();
      }
      
      if (config.cache.maxSize) {
        this.cache.setMaxSize(config.cache.maxSize);
      }
    }
    
    // Apply the new configuration
    this.applyConfiguration();
  }
  
  /**
   * Get the current configuration
   * @returns The current configuration
   */
  public getConfiguration(): MathJsConfig {
    return { ...this.config };
  }
  
  /**
   * Create a universal number
   * @param value - The value (number, string, or factors)
   * @param options - Creation options
   * @returns Promise resolving to the universal number
   */
  public async createUniversalNumber(
    value: number | string | Record<string, number>,
    options: UniversalNumberOptions = {}
  ): Promise<UniversalNumber> {
    // Generate cache key for this operation
    const cacheKey = `un_create_${JSON.stringify(value)}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Prepare parameters based on input type
    let params;
    if (typeof value === 'number') {
      params = { fromNumber: value };
    } else if (typeof value === 'string') {
      params = { fromString: value, base: options.base || 10 };
    } else if (typeof value === 'object') {
      params = { fromFactors: value };
    } else {
      throw new MathError('Invalid value type', MathErrorType.INVALID_ARGUMENT);
    }
    
    try {
      // Execute in worker if complex, otherwise direct
      if ((typeof value === 'number' && Math.abs(value) > 1000000) || 
          (typeof value === 'string' && value.length > 10) ||
          (typeof value === 'object' && Object.keys(value).length > 10)) {
        // Execute in worker
        const result = await this.executeInWorker<UniversalNumber>('universal', 'create', params);
        
        // Cache the result (assuming ~100 bytes per UN)
        this.cache.set(cacheKey, result, 100);
        
        return result;
      } else {
        // Direct execution for simple cases
        let result;
        if (typeof value === 'number') {
          result = UniversalNumber.fromNumber(value);
        } else if (typeof value === 'string') {
          result = UniversalNumber.fromString(value, options.base || 10);
        } else {
          result = UniversalNumber.fromFactors(value);
        }
        
        // Cache the result
        this.cache.set(cacheKey, result, 100);
        
        return result;
      }
    } catch (error: any) {
      throw new MathError(
        error.message || 'Error creating universal number',
        error.type || MathErrorType.UNKNOWN,
        error.details
      );
    }
  }
  
  /**
   * Check if a number is prime
   * @param value - The number to check
   * @returns Promise resolving to boolean indicating primality
   */
  public async isPrime(value: UniversalNumber | number | string): Promise<boolean> {
    // Generate cache key
    const cacheKey = `isPrime_${value.toString()}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    
    try {
      // Convert to UniversalNumber if needed
      const num = value instanceof UniversalNumber 
        ? value 
        : await this.createUniversalNumber(value);
      
      // Use worker for large numbers
      if (num.toString().length > 10) {
        const result = await this.executeInWorker<boolean>('prime', 'isPrime', { number: num });
        
        // Cache result (boolean is tiny)
        this.cache.set(cacheKey, result, 8);
        
        return result;
      } else {
        // Direct execution for small numbers
        const result = PrimeMath.isPrime(num);
        
        // Cache result
        this.cache.set(cacheKey, result, 8);
        
        return result;
      }
    } catch (error: any) {
      throw new MathError(
        error.message || 'Error checking primality',
        error.type || MathErrorType.UNKNOWN,
        error.details
      );
    }
  }
  
  /**
   * Factorize a number into its prime factors
   * @param value - The number to factorize
   * @returns Promise resolving to factorization (exponents map)
   */
  public async factorize(value: UniversalNumber | number | string): Promise<Record<string, number>> {
    // Generate cache key
    const cacheKey = `factorize_${value.toString()}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    
    try {
      // Convert to UniversalNumber if needed
      const num = value instanceof UniversalNumber 
        ? value 
        : await this.createUniversalNumber(value);
      
      // Always use worker for factorization (potentially intensive)
      const result = await this.executeInWorker<Record<string, number>>('prime', 'factorize', { number: num });
      
      // Cache result (size depends on factorization complexity)
      const resultSize = JSON.stringify(result).length * 2;
      this.cache.set(cacheKey, result, resultSize);
      
      return result;
    } catch (error: any) {
      throw new MathError(
        error.message || 'Error factorizing number',
        error.type || MathErrorType.UNKNOWN,
        error.details
      );
    }
  }
  
  /**
   * Calculate greatest common divisor
   * @param a - First number
   * @param b - Second number
   * @returns Promise resolving to GCD
   */
  public async gcd(
    a: UniversalNumber | number | string,
    b: UniversalNumber | number | string
  ): Promise<UniversalNumber> {
    // Generate cache key
    const cacheKey = `gcd_${a.toString()}_${b.toString()}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    
    try {
      // Convert to UniversalNumber if needed
      const numA = a instanceof UniversalNumber 
        ? a 
        : await this.createUniversalNumber(a);
      
      const numB = b instanceof UniversalNumber 
        ? b 
        : await this.createUniversalNumber(b);
      
      // Use worker for large numbers
      if (numA.toString().length > 10 || numB.toString().length > 10) {
        const result = await this.executeInWorker<UniversalNumber>('prime', 'gcd', { a: numA, b: numB });
        
        // Cache result
        this.cache.set(cacheKey, result, 100);
        
        return result;
      } else {
        // Direct execution for small numbers
        const result = PrimeMath.gcd(numA, numB);
        
        // Cache result
        this.cache.set(cacheKey, result, 100);
        
        return result;
      }
    } catch (error: any) {
      throw new MathError(
        error.message || 'Error calculating GCD',
        error.type || MathErrorType.UNKNOWN,
        error.details
      );
    }
  }
  
  /**
   * Calculate least common multiple
   * @param a - First number
   * @param b - Second number
   * @returns Promise resolving to LCM
   */
  public async lcm(
    a: UniversalNumber | number | string,
    b: UniversalNumber | number | string
  ): Promise<UniversalNumber> {
    // Generate cache key
    const cacheKey = `lcm_${a.toString()}_${b.toString()}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    
    try {
      // Convert to UniversalNumber if needed
      const numA = a instanceof UniversalNumber 
        ? a 
        : await this.createUniversalNumber(a);
      
      const numB = b instanceof UniversalNumber 
        ? b 
        : await this.createUniversalNumber(b);
      
      // Use worker for large numbers
      if (numA.toString().length > 10 || numB.toString().length > 10) {
        const result = await this.executeInWorker<UniversalNumber>('prime', 'lcm', { a: numA, b: numB });
        
        // Cache result
        this.cache.set(cacheKey, result, 100);
        
        return result;
      } else {
        // Direct execution for small numbers
        const result = PrimeMath.lcm(numA, numB);
        
        // Cache result
        this.cache.set(cacheKey, result, 100);
        
        return result;
      }
    } catch (error: any) {
      throw new MathError(
        error.message || 'Error calculating LCM',
        error.type || MathErrorType.UNKNOWN,
        error.details
      );
    }
  }
  
  /**
   * Execute an operation in a worker
   * @param category - Operation category
   * @param operation - Operation name
   * @param params - Operation parameters
   * @returns Promise resolving to the operation result
   */
  private async executeInWorker<T>(category: string, operation: string, params: any): Promise<T> {
    // Create a computation task
    const task = {
      id: `math-js-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation: {
        category,
        operation,
        params
      }
    };
    
    // Execute in worker
    const result = await new Promise<T>((resolve, reject) => {
      // Create worker
      const worker = new Worker(this.workerPath);
      
      // Handle response
      worker.onmessage = (event) => {
        const { id, result, error } = event.data;
        
        // Ignore unrelated messages
        if (id !== task.id && event.data.type !== 'ready') {
          return;
        }
        
        // Handle error
        if (error) {
          reject(new MathError(
            error.message || 'Worker error',
            error.type || MathErrorType.UNKNOWN,
            error.details
          ));
          worker.terminate();
          return;
        }
        
        // Handle result
        if (result) {
          resolve(result as T);
          worker.terminate();
        }
      };
      
      // Handle worker error
      worker.onerror = (error) => {
        reject(new MathError(
          error.message || 'Worker error',
          MathErrorType.UNKNOWN
        ));
        worker.terminate();
      };
      
      // Send task to worker
      worker.postMessage({
        id: task.id,
        category,
        operation,
        params
      });
    });
    
    return result;
  }
  
  /**
   * Get cache statistics
   * @returns The cache stats
   */
  public getCacheStats() {
    return this.cache.getStats();
  }
  
  /**
   * Clear the cache
   */
  public clearCache() {
    this.cache.clear();
  }
}