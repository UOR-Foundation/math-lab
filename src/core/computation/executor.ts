/**
 * Computation Executor for Math Lab
 * 
 * Handles the execution of mathematical operations using the WorkerManager
 * and ComputationQueue for task management and parallelization.
 */

import { WorkerManager, Task } from './worker-manager';
import { ComputationQueue, ComputationTask, TaskStatus, TaskPriority, CancelToken } from './computation-queue';
import { ASTNode } from '../expression-engine/types';
// Import necessary dependencies

/**
 * Execution plan for a computation
 */
export interface ExecutionPlan {
  ast: ASTNode;
  context?: Record<string, unknown>;
}

/**
 * Computation result type
 */
export interface ComputationResult<T = unknown> {
  value: T;
  duration: number;
  memoryUsage?: number;
}

/**
 * Options for computation execution
 */
export interface ExecutionOptions {
  priority?: TaskPriority;
  onProgress?: (progress: number) => void;
  cancelToken?: CancelToken;
  timeout?: number;
}

/**
 * Manages the execution of computations
 */
export class ComputationExecutor {
  public readonly workerManager: WorkerManager;
  private queue: ComputationQueue;
  
  /**
   * Create a new computation executor
   * @param workerPath - Path to the worker script
   * @param workerCount - Optional number of workers to create
   */
  constructor(workerPath: string, workerCount?: number) {
    // Worker path is passed directly to the worker manager
    this.workerManager = new WorkerManager(workerPath, workerCount);
    this.queue = new ComputationQueue();
  }

  /**
   * Initialize the executor
   */
  public initialize(): void {
    this.workerManager.initialize();
  }

  /**
   * Execute a computation
   * @param plan - The execution plan
   * @param options - Execution options
   * @returns Promise resolving to the computation result
   */
  public async execute<T>(
    plan: ExecutionPlan,
    options: ExecutionOptions = {}
  ): Promise<ComputationResult<T>> {
    const { 
      priority = TaskPriority.NORMAL,
      onProgress,
      cancelToken = new CancelToken(),
      timeout
    } = options;
    
    // Create a task in the queue
    const task = this.queue.createTask<T>(
      'execute',
      plan,
      priority,
      onProgress
    );
    
    // If a cancel token was provided, link it to the task's cancel token
    if (cancelToken !== task.cancelToken) {
      this.monitorExternalCancelToken(cancelToken, task.id);
    }
    
    // Set up timeout if specified
    let timeoutId: number | undefined;
    if (timeout) {
      timeoutId = window.setTimeout(() => {
        this.queue.cancelTask(task.id, 'Execution timed out');
      }, timeout);
    }
    
    try {
      // Update task status
      this.queue.updateTask(task.id, {
        status: TaskStatus.RUNNING
      });
      
      // Create worker task
      const workerTask: Task<T> = {
        id: task.id,
        type: 'execute',
        payload: plan,
        onProgress: progress => {
          this.queue.updateTask(task.id, { progress });
        },
        priority
      };
      
      // Execute in worker
      const result = await this.workerManager.execute<T>(workerTask);
      
      // Update task with result
      this.queue.updateTask(task.id, {
        status: TaskStatus.COMPLETED,
        result,
        progress: 1
      });
      
      const computationTask = this.queue.getTask<T>(task.id);
      
      // Calculate duration
      const duration = computationTask?.endTime && computationTask?.startTime
        ? computationTask.endTime - computationTask.startTime
        : 0;
      
      return {
        value: result,
        duration
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if the task was cancelled
      if (task.cancelToken.isCancelled) {
        this.queue.updateTask(task.id, {
          status: TaskStatus.CANCELLED,
          error: task.cancelToken.cancelReason || 'Task cancelled'
        });
        throw new Error(task.cancelToken.cancelReason || 'Task cancelled');
      }
      
      // Update task with error
      this.queue.updateTask(task.id, {
        status: TaskStatus.FAILED,
        error: errorMessage
      });
      
      throw error;
    } finally {
      // Clear timeout if it was set
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Execute multiple computations in parallel
   * @param plans - The execution plans
   * @param options - Execution options
   * @returns Promise resolving to an array of computation results
   */
  public async executeAll<T>(
    plans: ExecutionPlan[],
    options: ExecutionOptions = {}
  ): Promise<ComputationResult<T>[]> {
    return Promise.all(plans.map(plan => this.execute<T>(plan, options)));
  }

  /**
   * Cancel a computation
   * @param taskId - The task ID
   * @param reason - Optional reason for cancellation
   * @returns true if the task was cancelled, false otherwise
   */
  public cancel(taskId: string, reason?: string): boolean {
    const task = this.queue.cancelTask(taskId, reason);
    return !!task;
  }

  /**
   * Get all tasks in the queue
   * @returns Array of all tasks
   */
  public getTasks(): ComputationTask[] {
    return this.queue.getAllTasks();
  }

  /**
   * Get a task by ID
   * @param taskId - The task ID
   * @returns The task or undefined if not found
   */
  public getTask<T>(taskId: string): ComputationTask<T> | undefined {
    return this.queue.getTask<T>(taskId);
  }

  /**
   * Monitor an external cancel token and cancel the task if it's cancelled
   * @param externalToken - The external cancel token
   * @param taskId - The task ID
   * @returns Unsubscribe function
   */
  private monitorExternalCancelToken(externalToken: CancelToken, taskId: string): () => void {
    // Create a polling interval to check the external token
    const intervalId = setInterval(() => {
      if (externalToken.isCancelled) {
        this.queue.cancelTask(taskId, externalToken.cancelReason);
        clearInterval(intervalId);
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }
}