/**
 * React hook for using the computation manager in components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ComputationManager, 
  ComputationTask,
  ComputationResult,
  TaskPriority,
  TaskStatus,
  CancelToken
} from '../core/computation';
import { ASTNode } from '../core/expression-engine/types';

interface UseComputationOptions {
  autoExecute?: boolean;
  priority?: TaskPriority;
  context?: Record<string, unknown>;
  timeout?: number;
}

interface UseComputationResult<T> {
  result: ComputationResult<T> | null;
  task: ComputationTask<T> | null;
  status: TaskStatus | 'idle';
  progress: number;
  error: string | null;
  execute: (ast: ASTNode, context?: Record<string, unknown>) => Promise<ComputationResult<T>>;
  cancel: (reason?: string) => void;
  isRunning: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isFailed: boolean;
}

/**
 * Hook for using the computation manager
 * @param ast - Optional initial AST to execute
 * @param options - Computation options
 * @returns Computation state and functions
 */
export function useComputation<T>(
  initialAst?: ASTNode | null,
  options: UseComputationOptions = {}
): UseComputationResult<T> {
  // Configuration options with defaults
  const {
    autoExecute = false,
    priority = TaskPriority.NORMAL,
    context = {},
    timeout
  } = options;
  
  // State
  const [result, setResult] = useState<ComputationResult<T> | null>(null);
  const [task, setTask] = useState<ComputationTask<T> | null>(null);
  const [status, setStatus] = useState<TaskStatus | 'idle'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // References
  const cancelTokenRef = useRef<CancelToken | null>(null);
  const computationManagerRef = useRef<ComputationManager | null>(null);
  
  // Initialize computation manager
  useEffect(() => {
    if (!computationManagerRef.current) {
      computationManagerRef.current = ComputationManager.getInstance();
    }
  }, []);
  
  // Progress handler
  const handleProgress = useCallback((value: number) => {
    setProgress(value);
  }, []);
  
  // Execute computation
  const execute = useCallback(async (
    ast: ASTNode,
    execContext?: Record<string, unknown>
  ): Promise<ComputationResult<T>> => {
    if (!computationManagerRef.current) {
      throw new Error('Computation manager not initialized');
    }
    
    // Reset state
    setResult(null);
    setError(null);
    setStatus('idle');
    
    // Create a new cancel token
    cancelTokenRef.current = computationManagerRef.current.createCancelToken();
    
    try {
      // Set status to pending
      setStatus(TaskStatus.PENDING);
      
      // Execute computation
      const computationResult = await computationManagerRef.current.execute<T>(
        ast,
        execContext || context,
        {
          priority,
          onProgress: handleProgress,
          cancelToken: cancelTokenRef.current,
          timeout
        }
      );
      
      // Update state with result
      setResult(computationResult);
      setStatus(TaskStatus.COMPLETED);
      
      // Get task after execution
      const taskId = task?.id || '';
      if (taskId) {
        const updatedTask = computationManagerRef.current.getTask<T>(taskId);
        if (updatedTask) {
          setTask(updatedTask);
        }
      }
      
      return computationResult;
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Update status based on error
      if (cancelTokenRef.current?.isCancelled) {
        setStatus(TaskStatus.CANCELLED);
      } else {
        setStatus(TaskStatus.FAILED);
      }
      
      throw err;
    }
  }, [context, handleProgress, priority, task?.id, timeout]);
  
  // Cancel computation
  const cancel = useCallback((reason?: string) => {
    if (task?.id && computationManagerRef.current) {
      computationManagerRef.current.cancel(task.id, reason);
    } else if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel(reason);
    }
  }, [task?.id]);
  
  // Auto-execute when initialAst is provided and autoExecute is true
  useEffect(() => {
    if (initialAst && autoExecute) {
      execute(initialAst, context).catch(console.error);
    }
  }, [initialAst, autoExecute, execute, context]);
  
  // Derived state
  const isRunning = status === TaskStatus.PENDING || status === TaskStatus.RUNNING;
  const isCompleted = status === TaskStatus.COMPLETED;
  const isCancelled = status === TaskStatus.CANCELLED;
  const isFailed = status === TaskStatus.FAILED;
  
  return {
    result,
    task,
    status,
    progress,
    error,
    execute,
    cancel,
    isRunning,
    isCompleted,
    isCancelled,
    isFailed
  };
}