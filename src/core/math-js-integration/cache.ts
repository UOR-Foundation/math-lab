/**
 * Cache implementation for math-js operations
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { CacheStats } from './types';

/**
 * LRU Cache for math-js operations
 */
export class OperationCache {
  private cache: Map<string, any>;
  private keyTimestamps: Map<string, number>;
  private maxSize: number;
  private currentSize: number;
  private hits: number;
  private misses: number;
  private enabled: boolean;

  /**
   * Create a new cache
   * @param maxSize - Maximum cache size in bytes
   * @param enabled - Whether the cache is enabled
   */
  constructor(maxSize: number = 1024 * 1024 * 20, enabled: boolean = true) {
    this.cache = new Map<string, any>();
    this.keyTimestamps = new Map<string, number>();
    this.maxSize = maxSize;
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.enabled = enabled;
  }

  /**
   * Set a value in the cache
   * @param key - The cache key
   * @param value - The value to cache
   * @param size - The estimated size of the value in bytes
   * @returns true if the value was cached, false otherwise
   */
  set(key: string, value: any, size: number = 0): boolean {
    if (!this.enabled) return false;
    
    // If size is too large, don't cache
    if (size > this.maxSize) return false;
    
    // Make room if needed
    this.ensureSpace(size);
    
    // Update cache
    this.cache.set(key, value);
    this.keyTimestamps.set(key, Date.now());
    this.currentSize += size;
    
    return true;
  }

  /**
   * Get a value from the cache
   * @param key - The cache key
   * @returns The cached value or undefined if not found
   */
  get(key: string): any {
    if (!this.enabled) return undefined;
    
    const value = this.cache.get(key);
    
    if (value !== undefined) {
      this.hits++;
      this.keyTimestamps.set(key, Date.now()); // Update timestamp (LRU)
      return value;
    }
    
    this.misses++;
    return undefined;
  }

  /**
   * Check if a key exists in the cache
   * @param key - The cache key
   * @returns true if the key exists, false otherwise
   */
  has(key: string): boolean {
    return this.enabled && this.cache.has(key);
  }

  /**
   * Delete a key from the cache
   * @param key - The cache key
   * @param size - The estimated size of the value in bytes
   * @returns true if the key was deleted, false otherwise
   */
  delete(key: string, size: number = 0): boolean {
    if (!this.enabled || !this.cache.has(key)) return false;
    
    this.cache.delete(key);
    this.keyTimestamps.delete(key);
    this.currentSize -= size;
    
    return true;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.keyTimestamps.clear();
    this.currentSize = 0;
  }

  /**
   * Make sure there's enough space for a new value
   * @param size - The size of the new value
   */
  private ensureSpace(size: number): void {
    if (this.currentSize + size <= this.maxSize) return;
    
    // Get keys sorted by last access (oldest first)
    const sortedKeys = [...this.keyTimestamps.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
    
    // Remove oldest entries until there's enough space
    for (const key of sortedKeys) {
      if (this.currentSize + size <= this.maxSize) break;
      
      // Assuming 100 bytes per entry as a rough estimate
      // In a real implementation, we'd track sizes more accurately
      this.delete(key, 100);
    }
  }

  /**
   * Enable the cache
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable the cache
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Get cache stats
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: this.currentSize
    };
  }

  /**
   * Set max cache size
   * @param maxSize - Maximum size in bytes
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    this.ensureSpace(0);
  }
}