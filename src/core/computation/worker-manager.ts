/**
 * Worker Manager for Math Lab computation
 * 
 * Manages a pool of web workers for offloading mathematical computations
 * to separate threads, ensuring UI responsiveness during intensive calculations.
 */

export interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  id: number;
  memoryUsage?: number;
  lastActivity?: number;
  capabilities?: {
    hasMemoryMonitoring: boolean;
  };
}

export interface TaskResult<T> {
  id: string;
  result: T;
  error?: string;
}

export interface Task<_T = unknown> {
  id: string;
  type: string;
  payload: unknown;
  onProgress?: (progress: number) => void;
  priority?: number;
}

export interface TaskQueueItem<T = unknown> extends Omit<Task<unknown>, 'id'> {
  id: string;
  resolve: (result: T) => void;
  reject: (error: Error) => void;
}

/**
 * Manages a pool of web workers for computation offloading
 */
export class WorkerManager {
  private workers: WorkerInfo[] = [];
  private taskQueue: TaskQueueItem[] = [];
  private taskMap = new Map<string, TaskQueueItem>();
  private workerCount: number;
  private workerPath: string;
  private initialized = false;

  /**
   * Create a new WorkerManager
   * @param workerPath - Path to the worker script
   * @param workerCount - Number of workers to create (defaults to available CPU cores)
   */
  constructor(workerPath: string, workerCount?: number) {
    this.workerPath = workerPath;
    this.workerCount = workerCount ?? (navigator.hardwareConcurrency || 4);
  }

  /**
   * Initialize the worker pool
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    for (let i = 0; i < this.workerCount; i++) {
      this.createWorker(i);
    }

    this.initialized = true;
  }
  
  /**
   * Create a new worker and add it to the pool
   * @param id - Worker ID
   * @returns The created worker info
   */
  private createWorker(id: number): WorkerInfo {
    const worker = new Worker(this.workerPath, { type: 'module' });
    
    worker.onmessage = this.handleWorkerMessage.bind(this);
    worker.onerror = this.handleWorkerError.bind(this);
    
    const workerInfo: WorkerInfo = {
      worker,
      busy: true, // Start as busy until initialization complete
      id
    };
    
    this.workers.push(workerInfo);
    
    return workerInfo;
  }
  
  /**
   * Adjust the worker pool size
   * @param count - New worker count
   * @returns Whether the adjustment was successful
   */
  public adjustPoolSize(count: number): boolean {
    if (count < 1) {
      return false;
    }
    
    const currentCount = this.workers.length;
    
    // If we need to add workers
    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        this.createWorker(i);
      }
    }
    // If we need to remove workers
    else if (count < currentCount) {
      // Remove only idle workers
      const workersToRemove = this.workers
        .filter(w => !w.busy)
        .slice(0, currentCount - count);
      
      // Terminate workers
      for (const worker of workersToRemove) {
        worker.worker.terminate();
        const index = this.workers.indexOf(worker);
        if (index !== -1) {
          this.workers.splice(index, 1);
        }
      }
    }
    
    this.workerCount = count;
    
    return true;
  }

  /**
   * Execute a task on a worker
   * @param task - The task to execute
   * @returns Promise resolving to the task result
   */
  public execute<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queueItem: TaskQueueItem<T> = {
        ...task,
        resolve,
        reject
      };
      
      this.taskMap.set(task.id, queueItem as TaskQueueItem<unknown>);
      this.taskQueue.push(queueItem as TaskQueueItem<unknown>);
      
      // Sort task queue by priority (higher priority first)
      this.taskQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      this.processQueue();
    });
  }

  /**
   * Terminate all workers and clear the task queue
   */
  public terminate(): void {
    // Terminate all workers
    for (const workerInfo of this.workers) {
      workerInfo.worker.terminate();
    }
    
    // Clear workers array
    this.workers = [];
    
    // Reject all pending tasks
    for (const task of this.taskQueue) {
      (task as TaskQueueItem<unknown>).reject(new Error('Worker pool terminated'));
    }
    
    // Clear task queue and map
    this.taskQueue = [];
    this.taskMap.clear();
    
    this.initialized = false;
  }

  /**
   * Get a free worker from the pool
   * @returns A free worker or undefined if none are available
   */
  private getFreeWorker(): WorkerInfo | undefined {
    // Get all free workers
    const freeWorkers = this.workers.filter(w => !w.busy);
    
    if (freeWorkers.length === 0) {
      return undefined;
    }
    
    // If multiple free workers are available, pick the one with
    // the lowest memory usage (if available), or the one that was
    // used least recently
    return freeWorkers.sort((a, b) => {
      // If memory usage is available for both, use it for comparison
      if (a.memoryUsage !== undefined && b.memoryUsage !== undefined) {
        return a.memoryUsage - b.memoryUsage;
      }
      
      // Otherwise, use last activity timestamp
      const aLastActivity = a.lastActivity || 0;
      const bLastActivity = b.lastActivity || 0;
      
      // Prefer workers that haven't been used in a while
      return aLastActivity - bLastActivity;
    })[0];
  }
  
  /**
   * Get resource usage information for all workers
   * @returns Object containing resource usage statistics
   */
  public getResourceUsage(): { totalMemory?: number; averageMemory?: number; workerCount: number } {
    const workersWithMemory = this.workers.filter(w => w.memoryUsage !== undefined);
    
    if (workersWithMemory.length === 0) {
      return { workerCount: this.workers.length };
    }
    
    const totalMemory = workersWithMemory.reduce((total, w) => total + (w.memoryUsage || 0), 0);
    const averageMemory = totalMemory / workersWithMemory.length;
    
    return {
      totalMemory,
      averageMemory,
      workerCount: this.workers.length
    };
  }

  /**
   * Process the task queue by assigning tasks to free workers
   */
  private processQueue(): void {
    if (!this.initialized) {
      this.initialize();
    }

    while (this.taskQueue.length > 0) {
      const worker = this.getFreeWorker();
      
      if (!worker) {
        // No free workers, wait for one to become available
        break;
      }
      
      const task = this.taskQueue.shift();
      if (!task) break;
      
      worker.busy = true;
      worker.lastActivity = Date.now();
      
      worker.worker.postMessage({
        id: task.id,
        type: task.type,
        payload: task.payload
      });
    }
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const { id, result, error, progress, type, status, resource, warning } = event.data;
    
    // Find the worker that sent the message
    const workerIndex = this.workers.findIndex(w => w.worker === event.target);
    const worker = workerIndex !== -1 ? this.workers[workerIndex] : undefined;
    
    // Handle different message types
    if (type === 'init' && status === 'ready') {
      // Worker initialization complete
      if (worker) {
        worker.busy = false;
        this.processQueue(); // Start processing tasks if any are queued
      }
      return;
    }
    
    if (type === 'resource' && resource && worker) {
      // Update worker resource information (memory usage, etc.)
      // This could be used for advanced resource management
      if (resource.memory) {
        worker.memoryUsage = resource.memory.usedJSHeapSize;
      }
      return;
    }
    
    if (type === 'warning' && warning) {
      // Handle worker warnings (e.g., high memory usage)
      console.warn(`Worker ${worker?.id} warning:`, warning);
      return;
    }
    
    if (progress !== undefined) {
      // This is a progress update
      const task = this.taskMap.get(id);
      task?.onProgress?.(progress);
      return;
    }
    
    // For result or error messages (task completion)
    if (result !== undefined || error !== undefined) {
      // Mark the worker as free
      if (worker) {
        worker.busy = false;
      }
      
      // Find the task
      const task = this.taskMap.get(id);
      if (!task) {
        console.error(`No task found for id: ${id}`);
        return;
      }
      
      // Remove task from the map
      this.taskMap.delete(id);
      
      // Resolve or reject the task promise
      if (error) {
        task.reject(new Error(error));
      } else {
        task.resolve(result);
      }
      
      // Process the next task in the queue
      this.processQueue();
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(event: ErrorEvent): void {
    console.error('Worker error:', event);
    
    // Find the worker that errored
    const workerIndex = this.workers.findIndex(w => w.worker === event.target);
    
    if (workerIndex !== -1) {
      const worker = this.workers[workerIndex];
      
      // Replace the errored worker with a new one
      worker.worker.terminate();
      
      const newWorker = new Worker(this.workerPath, { type: 'module' });
      newWorker.onmessage = this.handleWorkerMessage.bind(this);
      newWorker.onerror = this.handleWorkerError.bind(this);
      
      this.workers[workerIndex] = {
        worker: newWorker,
        busy: false,
        id: worker.id
      };
    }
    
    // Process the next task in the queue
    this.processQueue();
  }
}