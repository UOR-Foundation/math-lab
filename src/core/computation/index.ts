/**
 * Computation Manager for Math Lab
 * 
 * Central interface for all computation-related functionality,
 * including worker management, task queuing, and execution.
 */

import { ComputationExecutor, ExecutionPlan, ComputationResult, ExecutionOptions } from './executor';
import { ComputationTask, TaskPriority, TaskStatus, CancelToken } from './computation-queue';
import { ASTNode } from '../expression-engine/types';

/**
 * Computation resource constraints
 */
export interface ResourceLimits {
  maxMemory?: number;  // Maximum memory usage in bytes
  maxTime?: number;    // Maximum execution time in milliseconds
  maxCpu?: number;     // Maximum CPU usage (0-1)
}

/**
 * Central manager for computation operations
 */
export class ComputationManager {
  private executor: ComputationExecutor;
  private readonly workerPath: string;
  private resourceLimits: ResourceLimits;
  
  private static instance: ComputationManager;
  
  /**
   * Create a new ComputationManager
   * @param workerPath - Path to the worker script
   * @param workerCount - Optional number of workers
   * @param resourceLimits - Optional resource constraints
   */
  private constructor(
    workerPath: string,
    workerCount?: number,
    resourceLimits: ResourceLimits = {}
  ) {
    this.workerPath = workerPath;
    this.executor = new ComputationExecutor(workerPath, workerCount);
    this.resourceLimits = {
      maxMemory: 1024 * 1024 * 100, // 100MB
      maxTime: 60 * 1000,           // 60 seconds
      maxCpu: 0.9,                  // 90% CPU utilization
      ...resourceLimits
    };
  }
  
  /**
   * Get the singleton instance of ComputationManager
   * @param workerPath - Path to the worker script
   * @param workerCount - Optional number of workers
   * @param resourceLimits - Optional resource constraints
   * @returns The ComputationManager instance
   */
  public static getInstance(
    workerPath: string = '/src/workers/computation-worker.js',
    workerCount?: number,
    resourceLimits?: ResourceLimits
  ): ComputationManager {
    if (!ComputationManager.instance) {
      ComputationManager.instance = new ComputationManager(
        workerPath,
        workerCount,
        resourceLimits
      );
      
      // Initialize the executor
      ComputationManager.instance.executor.initialize();
    }
    
    return ComputationManager.instance;
  }
  
  /**
   * Execute a computation based on an AST
   * @param ast - Abstract Syntax Tree to execute
   * @param context - Optional execution context
   * @param options - Optional execution options
   * @returns Promise resolving to the computation result
   */
  public async execute<T>(
    ast: ASTNode,
    context?: Record<string, any>,
    options: ExecutionOptions = {}
  ): Promise<ComputationResult<T>> {
    // Apply resource limits to options
    const enhancedOptions: ExecutionOptions = {
      ...options,
      timeout: options.timeout || this.resourceLimits.maxTime,
    };
    
    const plan: ExecutionPlan = {
      ast,
      context
    };
    
    return this.executor.execute<T>(plan, enhancedOptions);
  }
  
  /**
   * Execute multiple computations in parallel
   * @param asts - Array of ASTs to execute
   * @param contexts - Optional array of execution contexts
   * @param options - Optional execution options
   * @returns Promise resolving to an array of computation results
   */
  public async executeAll<T>(
    asts: ASTNode[],
    contexts?: Record<string, any>[],
    options: ExecutionOptions = {}
  ): Promise<ComputationResult<T>[]> {
    const plans: ExecutionPlan[] = asts.map((ast, index) => ({
      ast,
      context: contexts ? contexts[index] : undefined
    }));
    
    return this.executor.executeAll<T>(plans, options);
  }
  
  /**
   * Cancel a computation
   * @param taskId - The task ID
   * @param reason - Optional reason for cancellation
   * @returns true if the task was cancelled, false otherwise
   */
  public cancel(taskId: string, reason?: string): boolean {
    return this.executor.cancel(taskId, reason);
  }
  
  /**
   * Get all computation tasks
   * @returns Array of all tasks
   */
  public getTasks(): ComputationTask[] {
    return this.executor.getTasks();
  }
  
  /**
   * Get a task by ID
   * @param taskId - The task ID
   * @returns The task or undefined if not found
   */
  public getTask<T>(taskId: string): ComputationTask<T> | undefined {
    return this.executor.getTask<T>(taskId);
  }
  
  /**
   * Create a cancellation token
   * @returns A new cancellation token
   */
  public createCancelToken(): CancelToken {
    return new CancelToken();
  }
  
  /**
   * Update resource limits
   * @param limits - The new resource limits
   * @returns The updated resource limits
   */
  public setResourceLimits(limits: Partial<ResourceLimits>): ResourceLimits {
    this.resourceLimits = {
      ...this.resourceLimits,
      ...limits
    };
    
    return this.resourceLimits;
  }
  
  /**
   * Get current resource limits
   * @returns The current resource limits
   */
  public getResourceLimits(): ResourceLimits {
    return { ...this.resourceLimits };
  }
}

// Export types
export type { ExecutionPlan, ComputationResult, ExecutionOptions };
export type { ComputationTask };
export { TaskPriority, TaskStatus, CancelToken };