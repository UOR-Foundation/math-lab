/**
 * Types for the UOR Foundation math-js integration
 */

// Configuration options for math-js library
export interface MathJsConfig {
  performanceProfile: 'balanced' | 'memory' | 'speed';
  factorization: {
    algorithm: 'auto' | 'trial-division' | 'pollard-rho' | 'quadratic-sieve';
    lazy: boolean;
  };
  cache: {
    enabled: boolean;
    maxSize: number; // Size in bytes
  };
}

// Default configuration
export const defaultConfig: MathJsConfig = {
  performanceProfile: 'balanced',
  factorization: {
    algorithm: 'auto',
    lazy: true
  },
  cache: {
    enabled: true,
    maxSize: 1024 * 1024 * 20 // 20MB
  }
};

// Universal Number options
export interface UniversalNumberOptions {
  precision?: number;
  base?: number;
  roundingMode?: 'up' | 'down' | 'ceiling' | 'floor' | 'half-up' | 'half-down' | 'half-even';
}

// Cache stats
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  usage: number; // Size in bytes
}

// Error types for math-js operations
export enum MathErrorType {
  OVERFLOW = 'overflow',
  DIVISION_BY_ZERO = 'division_by_zero',
  INVALID_ARGUMENT = 'invalid_argument',
  PRECISION_LOSS = 'precision_loss',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

// Error class for math-js operations
export class MathError extends Error {
  type: MathErrorType;
  details?: Record<string, unknown>;

  constructor(message: string, type: MathErrorType = MathErrorType.UNKNOWN, details?: Record<string, unknown>) {
    super(message);
    this.name = 'MathError';
    this.type = type;
    this.details = details;
  }
}