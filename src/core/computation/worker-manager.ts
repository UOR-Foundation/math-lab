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
}

export interface TaskResult<T> {
  id: string;
  result: T;
  error?: string;
}

export interface Task<T = unknown> {
  id: string;
  type: string;
  payload: unknown;
  onProgress?: (progress: number) => void;
  priority?: number;
}

export interface TaskQueueItem<T = unknown> extends Task<T> {
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
      const worker = new Worker(this.workerPath, { type: 'module' });
      
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = this.handleWorkerError.bind(this);
      
      this.workers.push({
        worker,
        busy: false,
        id: i
      });
    }

    this.initialized = true;
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
      
      this.taskMap.set(task.id, queueItem);
      this.taskQueue.push(queueItem);
      
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
      task.reject(new Error('Worker pool terminated'));
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
    return this.workers.find(w => !w.busy);
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
    const { id, result, error, progress } = event.data;
    
    // Find the worker that sent the message
    const workerIndex = this.workers.findIndex(w => w.worker === event.target);
    
    if (progress !== undefined) {
      // This is a progress update
      const task = this.taskMap.get(id);
      task?.onProgress?.(progress);
      return;
    }
    
    // Mark the worker as free
    if (workerIndex !== -1) {
      this.workers[workerIndex].busy = false;
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