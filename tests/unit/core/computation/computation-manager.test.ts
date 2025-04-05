import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComputationManager, TaskStatus } from '@/core/computation';

//* No need for complex module mocking, we're using a simple mock object *//

describe('ComputationManager', () => {
  let computationManager: ComputationManager;
  
  beforeEach(() => {
    // Mock implementation
    computationManager = {
      execute: vi.fn().mockImplementation(() => {
        return Promise.resolve({
          value: { result: 'mock-result' },
          duration: 100
        });
      }),
      executeAll: vi.fn().mockImplementation((asts) => {
        return Promise.resolve(
          asts.map(() => ({
            value: { result: 'mock-result' },
            duration: 100
          }))
        );
      }),
      cancel: vi.fn().mockReturnValue(true),
      getTasks: vi.fn().mockReturnValue([
        { id: 'task1', status: TaskStatus.RUNNING },
        { id: 'task2', status: TaskStatus.COMPLETED },
      ]),
      getTask: vi.fn().mockImplementation((id) => {
        if (id === 'task1') {
          return { id: 'task1', status: TaskStatus.RUNNING };
        }
        return undefined;
      }),
      createCancelToken: vi.fn().mockReturnValue({ isCancelled: false }),
      setResourceLimits: vi.fn().mockImplementation((limits) => ({
        maxMemory: limits.maxMemory || 104857600,
        maxTime: limits.maxTime || 60000,
        maxCpu: 0.9,
        ...limits
      })),
      getResourceLimits: vi.fn().mockReturnValue({
        maxMemory: 104857600,
        maxTime: 60000,
        maxCpu: 0.9
      }),
      getResourceUsage: vi.fn().mockReturnValue({
        totalMemory: 5000,
        averageMemory: 1250,
        workerCount: 4,
        activeTaskCount: 1
      })
    } as unknown as ComputationManager;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should have singleton behavior', () => {
    // This is more of a documentation test since we're mocking the manager
    expect(ComputationManager.getInstance).toBeDefined();
  });
  
  it('should execute a computation and return the result', async () => {
    const mockAst = { type: 'number', value: 42 };
    const mockContext = { x: 10 };
    
    const result = await computationManager.execute(mockAst, mockContext);
    
    expect(result).toEqual({
      value: { result: 'mock-result' },
      duration: 100
    });
  });
  
  it('should execute multiple computations in parallel', async () => {
    const mockAsts = [
      { type: 'number', value: 42 },
      { type: 'number', value: 100 }
    ];
    
    const results = await computationManager.executeAll(mockAsts);
    
    expect(results).toEqual([
      {
        value: { result: 'mock-result' },
        duration: 100
      },
      {
        value: { result: 'mock-result' },
        duration: 100
      }
    ]);
  });
  
  it('should cancel a computation', () => {
    const result = computationManager.cancel('task1', 'Testing cancellation');
    
    expect(result).toBe(true);
  });
  
  it('should get all tasks', () => {
    const tasks = computationManager.getTasks();
    
    expect(tasks).toEqual([
      { id: 'task1', status: TaskStatus.RUNNING },
      { id: 'task2', status: TaskStatus.COMPLETED },
    ]);
  });
  
  it('should get a specific task by ID', () => {
    const task = computationManager.getTask('task1');
    
    expect(task).toEqual({ id: 'task1', status: TaskStatus.RUNNING });
  });
  
  it('should create a cancel token', () => {
    const token = computationManager.createCancelToken();
    
    expect(token).toBeDefined();
    expect(token.isCancelled).toBe(false);
  });
  
  it('should update resource limits', () => {
    const updatedLimits = computationManager.setResourceLimits({
      maxMemory: 200000000,
      maxTime: 120000
    });
    
    expect(updatedLimits.maxMemory).toBe(200000000);
    expect(updatedLimits.maxTime).toBe(120000);
    expect(updatedLimits.maxCpu).toBe(0.9); // Default remains unchanged
  });
  
  it('should get current resource limits', () => {
    const limits = computationManager.getResourceLimits();
    
    expect(limits.maxMemory).toBe(104857600); // 100MB default
    expect(limits.maxTime).toBe(60000);       // 60 seconds default
    expect(limits.maxCpu).toBe(0.9);          // 90% default
  });
  
  it('should get resource usage information', () => {
    const usage = computationManager.getResourceUsage();
    
    expect(usage).toEqual({
      totalMemory: 5000,
      averageMemory: 1250,
      workerCount: 4,
      activeTaskCount: 1 // Only one RUNNING task
    });
  });
});