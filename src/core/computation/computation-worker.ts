/**
 * Web Worker for Math Lab computation
 * 
 * Runs in a separate thread to execute heavy mathematical calculations
 * without blocking the main UI thread.
 */

import { Evaluator } from '../expression-engine/evaluator';

// Task types
const TASK_TYPES = {
  EXECUTE: 'execute',
  EVALUATE: 'evaluate',
  CANCEL: 'cancel'
};

// Active tasks
const activeTasks = new Map<string, { cancelled: boolean }>();

/**
 * Send a progress update to the main thread
 * @param id - Task ID
 * @param progress - Progress value (0-1)
 */
function sendProgress(id: string, progress: number): void {
  self.postMessage({
    id,
    progress
  });
}

/**
 * Send a result to the main thread
 * @param id - Task ID
 * @param result - Result value
 */
function sendResult(id: string, result: unknown): void {
  self.postMessage({
    id,
    result
  });
}

/**
 * Send an error to the main thread
 * @param id - Task ID
 * @param error - Error message
 */
function sendError(id: string, error: string): void {
  self.postMessage({
    id,
    error
  });
}

/**
 * Execute an AST using the evaluator
 * @param id - Task ID
 * @param ast - Abstract Syntax Tree to evaluate
 * @param context - Evaluation context
 */
function executeAst(id: string, ast: unknown, context: Record<string, unknown> = {}): void {
  try {
    // Create task record
    activeTasks.set(id, { cancelled: false });
    
    // Send initial progress
    sendProgress(id, 0);
    
    // Create evaluator with custom context
    const evaluator = new Evaluator(context);
    
    // Check if task was cancelled
    if (activeTasks.get(id)?.cancelled) {
      sendError(id, 'Task cancelled');
      activeTasks.delete(id);
      return;
    }
    
    // Evaluate the AST - need to cast since we know the internal implementation
    // Using unknown cast instead of any
    const result = evaluator.evaluate(ast as unknown as import('../expression-engine/types').ASTNode);
    
    // Send mid-progress
    sendProgress(id, 0.5);
    
    // Check if task was cancelled
    if (activeTasks.get(id)?.cancelled) {
      sendError(id, 'Task cancelled');
      activeTasks.delete(id);
      return;
    }
    
    // Send final progress
    sendProgress(id, 1);
    
    // Send result
    sendResult(id, result);
    
    // Clean up task record
    activeTasks.delete(id);
  } catch (error) {
    // Send error
    sendError(
      id,
      error instanceof Error ? error.message : 'Unknown error in worker'
    );
    
    // Clean up task record
    activeTasks.delete(id);
  }
}

/**
 * Handle messages from the main thread
 */
self.onmessage = function(event: MessageEvent) {
  const { id, type, payload } = event.data;
  
  switch (type) {
    case TASK_TYPES.EXECUTE:
      executeAst(id, payload.ast, payload.context);
      break;
      
    case TASK_TYPES.CANCEL: {      
      // Mark task as cancelled
      const task = activeTasks.get(id);
      if (task) {
        task.cancelled = true;
      }
      break;
    }
      
    default:
      sendError(id, `Unknown task type: ${type}`);
  }
};

// Report that the worker is ready
self.postMessage({ type: 'ready' });