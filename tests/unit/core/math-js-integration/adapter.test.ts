/**
 * Tests for math-js adapter
 */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { describe, it, expect, vi } from 'vitest';
import { MathError, MathErrorType } from '../../../../src/core/math-js-integration/types';
import { OperationCache } from '../../../../src/core/math-js-integration/cache';

// Mock the foundational library
vi.mock('uor-foundation-math-js', () => ({
  UniversalNumber: {
    fromNumber: vi.fn((n) => ({ value: n, toString: () => n.toString() })),
    fromString: vi.fn((s) => ({ value: parseInt(s), toString: () => s })),
    fromFactors: vi.fn((f) => ({ factors: f, toString: () => JSON.stringify(f) })),
    fromAny: vi.fn((v) => ({ value: v, toString: () => String(v) }))
  },
  PrimeMath: {
    isPrime: vi.fn(() => true),
    factorize: vi.fn(() => ({ '2': 1, '3': 1 })),
    gcd: vi.fn(() => ({ value: 1, toString: () => '1' })),
    lcm: vi.fn(() => ({ value: 42, toString: () => '42' }))
  },
  configure: vi.fn()
}));

// Test just the cache functionality which doesn't depend directly on math-js
describe('OperationCache', () => {
  it('should store and retrieve values', () => {
    const cache = new OperationCache(1000, true);
    
    // Set a value
    cache.set('test', 'value', 10);
    
    // Get the value
    const value = cache.get('test');
    
    // Check it was stored correctly
    expect(value).toBe('value');
    
    // Check stats
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.size).toBe(1);
  });
  
  it('should respect enabled flag', () => {
    const cache = new OperationCache(1000, false);
    
    // Set a value when disabled
    const result = cache.set('test', 'value', 10);
    
    // Check it wasn't stored
    expect(result).toBe(false);
    
    // Get should return undefined
    const value = cache.get('test');
    expect(value).toBeUndefined();
  });
  
  it('should handle size limits', () => {
    const cache = new OperationCache(20, true);
    
    // Add items that exceed the cache size
    cache.set('key1', 'value1', 10);
    cache.set('key2', 'value2', 15); // This should cause key1 to be evicted
    
    // Check key1 was evicted
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
  });
  
  it('should clear cache', () => {
    const cache = new OperationCache(1000, true);
    
    // Set some values
    cache.set('test1', 'value1', 10);
    cache.set('test2', 'value2', 10);
    
    // Clear cache
    cache.clear();
    
    // Check all values were cleared
    expect(cache.get('test1')).toBeUndefined();
    expect(cache.get('test2')).toBeUndefined();
    
    // Check stats
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
  });
});