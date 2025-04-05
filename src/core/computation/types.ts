/**
 * Types for Computation System
 */

// Task priority levels
export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

// Task status values
export enum TaskStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Base task interface
export interface ComputationTask {
  id: string;
  type: string;
  data: unknown;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  progress?: number;
  error?: Error;
  result?: unknown;
}

// Task execution options
export interface TaskOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: unknown) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

// Worker message types
export enum WorkerMessageType {
  INITIALIZE = 'initialize',
  EXECUTE = 'execute',
  CANCEL = 'cancel',
  PROGRESS = 'progress',
  RESULT = 'result',
  ERROR = 'error',
}

// Messages sent to worker
export interface WorkerRequestMessage {
  type: WorkerMessageType;
  taskId?: string;
  task?: {
    type: string;
    data: unknown;
  };
  config?: unknown;
}

// Messages received from worker
export interface WorkerResponseMessage {
  type: WorkerMessageType;
  taskId?: string;
  result?: unknown;
  progress?: number;
  error?: {
    message: string;
    stack?: string;
  };
}

// Worker status
export interface WorkerStatus {
  id: string;
  busy: boolean;
  taskId?: string;
  taskType?: string;
  startTime?: number;
  memoryUsage?: number;
}

// Worker pool configuration
export interface WorkerPoolConfig {
  minWorkers?: number;
  maxWorkers?: number;
  idleTimeout?: number;
  taskTimeout?: number;
}