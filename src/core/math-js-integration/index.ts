/**
 * UOR Foundation math-js integration for Math Lab
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Re-export the adapter for direct use
export { MathJsAdapter } from './adapter';

// Re-export types
export * from './types';

// Re-export cache
export { OperationCache } from './cache';

// Export a singleton instance for easy access
import { MathJsAdapter } from './adapter';
import { MathJsConfig } from './types';

/**
 * Get the singleton instance of the math-js adapter
 * @param config - Configuration options
 * @param workerPath - Path to the math-js worker
 * @returns The MathJsAdapter instance
 */
export function getMathJs(config: Partial<MathJsConfig> = {}, workerPath?: string): MathJsAdapter {
  return MathJsAdapter.getInstance(config, workerPath);
}

/**
 * Configure the math-js integration
 * @param config - Configuration options
 */
export function configure(config: Partial<MathJsConfig>): void {
  MathJsAdapter.getInstance(config);
}

// Convenience function for creating a universal number
/**
 * Create a universal number
 * @param value - The value (number, string, or factors)
 * @param options - Creation options
 * @returns Promise resolving to the universal number
 */
export async function createUniversalNumber(
  value: number | string | Record<string, number>,
  options = {}
) {
  return MathJsAdapter.getInstance().createUniversalNumber(value, options);
}

// Convenience wrappers for common operations
/**
 * Check if a number is prime
 * @param value - The number to check
 * @returns Promise resolving to boolean indicating primality
 */
export async function isPrime(value: any) {
  return MathJsAdapter.getInstance().isPrime(value);
}

/**
 * Factorize a number into its prime factors
 * @param value - The number to factorize
 * @returns Promise resolving to factorization (exponents map)
 */
export async function factorize(value: any) {
  return MathJsAdapter.getInstance().factorize(value);
}

/**
 * Calculate greatest common divisor
 * @param a - First number
 * @param b - Second number
 * @returns Promise resolving to GCD
 */
export async function gcd(a: any, b: any) {
  return MathJsAdapter.getInstance().gcd(a, b);
}

/**
 * Calculate least common multiple
 * @param a - First number
 * @param b - Second number
 * @returns Promise resolving to LCM
 */
export async function lcm(a: any, b: any) {
  return MathJsAdapter.getInstance().lcm(a, b);
}