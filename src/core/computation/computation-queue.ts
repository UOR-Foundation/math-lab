/**
 * Computation Queue for Math Lab
 * 
 * Manages the prioritization and execution of computation tasks,
 * including cancellation, progress tracking, and resource management.
 */

import { v4 as uuidv4 } from 'uuid';

export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export interface ComputationTask<T = unknown> {
  id: string;
  type: string;
  payload: unknown;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  result?: T;
  error?: string;
  startTime?: number;
  endTime?: number;
  cancelToken: CancelToken;
  onProgress?: (progress: number) => void;
}

export class CancelToken {
  private _isCancelled = false;
  private _cancelReason?: string;

  public cancel(reason?: string): void {
    this._isCancelled = true;
    this._cancelReason = reason;
  }

  public get isCancelled(): boolean {
    return this._isCancelled;
  }

  public get cancelReason(): string | undefined {
    return this._cancelReason;
  }
}

/**
 * Manages computation tasks in a prioritized queue
 */
export class ComputationQueue {
  private tasks: Map<string, ComputationTask> = new Map();
  private listeners: Map<string, Set<(task: ComputationTask) => void>> = new Map();

  /**
   * Create a new computation task
   * @param type - The task type
   * @param payload - The task data
   * @param priority - Task priority (default: NORMAL)
   * @param onProgress - Optional progress callback
   * @returns The created task
   */
  public createTask<T>(
    type: string,
    payload: any,
    priority: TaskPriority = TaskPriority.NORMAL,
    onProgress?: (progress: number) => void
  ): ComputationTask<T> {
    const id = uuidv4();
    const cancelToken = new CancelToken();
    
    const task: ComputationTask<T> = {
      id,
      type,
      payload,
      priority,
      status: TaskStatus.PENDING,
      progress: 0,
      cancelToken,
      onProgress,
    };
    
    this.tasks.set(id, task);
    this.notifyListeners('taskCreated', task);
    
    return task;
  }

  /**
   * Get a task by ID
   * @param id - The task ID
   * @returns The task or undefined if not found
   */
  public getTask<T>(id: string): ComputationTask<T> | undefined {
    return this.tasks.get(id) as ComputationTask<T> | undefined;
  }

  /**
   * Update a task's status and other properties
   * @param id - The task ID
   * @param updates - Object with properties to update
   * @returns The updated task or undefined if not found
   */
  public updateTask<T>(
    id: string,
    updates: Partial<ComputationTask<T>>
  ): ComputationTask<T> | undefined {
    const task = this.tasks.get(id) as ComputationTask<T> | undefined;
    
    if (!task) {
      return undefined;
    }
    
    // Update task properties
    Object.assign(task, updates);
    
    // If progress was updated, call the onProgress callback
    if (updates.progress !== undefined && task.onProgress) {
      task.onProgress(task.progress);
    }
    
    // If status changed to RUNNING, set start time
    if (updates.status === TaskStatus.RUNNING && !task.startTime) {
      task.startTime = Date.now();
    }
    
    // If status changed to COMPLETED or FAILED, set end time
    if (
      (updates.status === TaskStatus.COMPLETED || 
       updates.status === TaskStatus.FAILED ||
       updates.status === TaskStatus.CANCELLED) && 
      !task.endTime
    ) {
      task.endTime = Date.now();
    }
    
    this.notifyListeners('taskUpdated', task);
    
    return task;
  }

  /**
   * Cancel a task
   * @param id - The task ID
   * @param reason - Optional reason for cancellation
   * @returns The cancelled task or undefined if not found
   */
  public cancelTask<T>(id: string, reason?: string): ComputationTask<T> | undefined {
    const task = this.tasks.get(id) as ComputationTask<T> | undefined;
    
    if (!task) {
      return undefined;
    }
    
    task.cancelToken.cancel(reason);
    
    this.updateTask(id, {
      status: TaskStatus.CANCELLED,
      error: reason || 'Task cancelled'
    });
    
    this.notifyListeners('taskCancelled', task);
    
    return task;
  }

  /**
   * Remove a task from the queue
   * @param id - The task ID
   * @returns true if the task was removed, false otherwise
   */
  public removeTask(id: string): boolean {
    const task = this.tasks.get(id);
    
    if (!task) {
      return false;
    }
    
    this.tasks.delete(id);
    this.notifyListeners('taskRemoved', task);
    
    return true;
  }

  /**
   * Get all tasks
   * @returns Array of all tasks
   */
  public getAllTasks(): ComputationTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get pending tasks sorted by priority
   * @returns Array of pending tasks
   */
  public getPendingTasks(): ComputationTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.PENDING)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Subscribe to task events
   * @param event - The event type to listen for
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  public subscribe(
    event: 'taskCreated' | 'taskUpdated' | 'taskCancelled' | 'taskRemoved',
    listener: (task: ComputationTask) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Notify listeners of a task event
   * @param event - The event type
   * @param task - The task object
   */
  private notifyListeners(event: string, task: ComputationTask): void {
    const listeners = this.listeners.get(event);
    
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(task);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      }
    }
  }
}