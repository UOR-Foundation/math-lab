/**
 * Type declarations for UOR Foundation's math-js library
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'uor-foundation-math-js' {
  /**
   * Universal Number class
   */
  export class UniversalNumber {
    static fromNumber(n: number): UniversalNumber;
    static fromString(s: string, base?: number): UniversalNumber;
    static fromFactors(factors: Record<string, number>): UniversalNumber;
    static fromAny(value: any): UniversalNumber;
    
    add(other: UniversalNumber): UniversalNumber;
    subtract(other: UniversalNumber): UniversalNumber;
    multiply(other: UniversalNumber): UniversalNumber;
    divide(other: UniversalNumber): UniversalNumber;
    
    toString(base?: number): string;
    toJSON(): object;
    valueOf(): number;
  }
  
  /**
   * Prime math operations
   */
  export class PrimeMath {
    static isPrime(num: UniversalNumber): boolean;
    static factorize(num: UniversalNumber): Record<string, number>;
    static gcd(a: UniversalNumber, b: UniversalNumber): UniversalNumber;
    static lcm(a: UniversalNumber, b: UniversalNumber): UniversalNumber;
  }
  
  /**
   * Library configuration
   */
  export interface MathJsLibConfig {
    performanceProfile?: 'balanced' | 'memory' | 'speed';
    factorization?: {
      algorithm?: 'auto' | 'trial-division' | 'pollard-rho' | 'quadratic-sieve';
      lazy?: boolean;
    };
    cache?: {
      enabled?: boolean;
      maxSize?: number;
    };
  }
  
  /**
   * Configure the library
   * @param config - Configuration options
   */
  export function configure(config: MathJsLibConfig): void;
}