/**
 * React hook for using the MathJs adapter in components
 */

import { useState, useCallback } from 'react';
import { MathJsAdapter } from '../core/math-js-integration/adapter';
import { UniversalNumberOptions, MathError } from '../core/math-js-integration/types';
import { useAppDispatch } from './useAppDispatch';
import { addResult } from '../store/slices/resultsSlice';

// A simpler, hook-friendly type for math operations
export type MathOperation = (a: number | string, b: number | string) => Promise<string>;

interface UseMathJsResult {
  // Universal Number operations
  createUniversalNumber: (value: number | string, options?: UniversalNumberOptions) => Promise<string>;
  // Basic operations
  add: MathOperation;
  subtract: MathOperation;
  multiply: MathOperation;
  divide: MathOperation;
  // Number theory operations
  isPrime: (value: number | string) => Promise<boolean>;
  factorize: (value: number | string) => Promise<Record<string, number>>;
  gcd: MathOperation;
  lcm: MathOperation;
  // Utility
  clearCache: () => void;
  // State
  error: MathError | null;
  loading: boolean;
}

/**
 * Hook for using math-js operations
 * @returns Math-js operations and state
 */
export function useMathJs(): UseMathJsResult {
  const [error, setError] = useState<MathError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  // Get the adapter instance
  const adapter = MathJsAdapter.getInstance();

  /**
   * Wrapper for handling errors consistently
   * @param operation - The operation to execute
   */
  const handleOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    addToResults: boolean = false,
    metaData: { expression?: string; type?: string } = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const start = performance.now();
      const result = await operation();
      const end = performance.now();
      
      // Add to results if requested
      if (addToResults) {
        dispatch(addResult({
          value: result,
          timestamp: new Date().toISOString(),
          duration: end - start,
          type: metaData.type || 'calculation',
          metadata: {
            expression: metaData.expression,
          }
        }));
      }
      
      return result;
    } catch (err) {
      if (err instanceof MathError) {
        setError(err);
      } else {
        setError(new MathError(
          err instanceof Error ? err.message : 'Unknown error'
        ));
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Create a universal number
  const createUniversalNumber = useCallback(async (
    value: number | string,
    options?: UniversalNumberOptions
  ): Promise<string> => {
    return handleOperation(async () => {
      const result = await adapter.createUniversalNumber(value, options);
      return result.toString();
    }, false, { expression: `UN(${value})` });
  }, [adapter, handleOperation]);

  // Addition
  const add = useCallback(async (a: number | string, b: number | string): Promise<string> => {
    return handleOperation(async () => {
      const numA = await adapter.createUniversalNumber(a);
      const numB = await adapter.createUniversalNumber(b);
      const result = numA.add(numB);
      return result.toString();
    }, true, { expression: `${a} + ${b}` });
  }, [adapter, handleOperation]);

  // Subtraction
  const subtract = useCallback(async (a: number | string, b: number | string): Promise<string> => {
    return handleOperation(async () => {
      const numA = await adapter.createUniversalNumber(a);
      const numB = await adapter.createUniversalNumber(b);
      const result = numA.subtract(numB);
      return result.toString();
    }, true, { expression: `${a} - ${b}` });
  }, [adapter, handleOperation]);

  // Multiplication
  const multiply = useCallback(async (a: number | string, b: number | string): Promise<string> => {
    return handleOperation(async () => {
      const numA = await adapter.createUniversalNumber(a);
      const numB = await adapter.createUniversalNumber(b);
      const result = numA.multiply(numB);
      return result.toString();
    }, true, { expression: `${a} × ${b}` });
  }, [adapter, handleOperation]);

  // Division
  const divide = useCallback(async (a: number | string, b: number | string): Promise<string> => {
    return handleOperation(async () => {
      const numA = await adapter.createUniversalNumber(a);
      const numB = await adapter.createUniversalNumber(b);
      const result = numA.divide(numB);
      return result.toString();
    }, true, { expression: `${a} ÷ ${b}` });
  }, [adapter, handleOperation]);

  // Is Prime
  const isPrime = useCallback(async (value: number | string): Promise<boolean> => {
    return handleOperation(async () => {
      const result = await adapter.isPrime(value);
      return result;
    }, true, { expression: `isPrime(${value})`, type: 'primality-test' });
  }, [adapter, handleOperation]);

  // Factorize
  const factorize = useCallback(async (value: number | string): Promise<Record<string, number>> => {
    return handleOperation(async () => {
      const result = await adapter.factorize(value);
      return result;
    }, true, { expression: `factorize(${value})`, type: 'factorization' });
  }, [adapter, handleOperation]);

  // GCD
  const gcd = useCallback(async (a: number | string, b: number | string): Promise<string> => {
    return handleOperation(async () => {
      const result = await adapter.gcd(a, b);
      return result.toString();
    }, true, { expression: `gcd(${a}, ${b})`, type: 'number-theory' });
  }, [adapter, handleOperation]);

  // LCM
  const lcm = useCallback(async (a: number | string, b: number | string): Promise<string> => {
    return handleOperation(async () => {
      const result = await adapter.lcm(a, b);
      return result.toString();
    }, true, { expression: `lcm(${a}, ${b})`, type: 'number-theory' });
  }, [adapter, handleOperation]);

  // Clear cache
  const clearCache = useCallback(() => {
    adapter.clearCache();
  }, [adapter]);

  return {
    createUniversalNumber,
    add,
    subtract,
    multiply,
    divide,
    isPrime,
    factorize,
    gcd,
    lcm,
    clearCache,
    error,
    loading
  };
}