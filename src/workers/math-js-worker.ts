/**
 * Web Worker for offloading math-js operations
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */

import { UniversalNumber, PrimeMath } from 'uor-foundation-math-js';
import { MathErrorType } from '../core/math-js-integration/types';

// Worker context
const ctx: Worker = self as any;

// Error handling
function handleError(error: any) {
  let type = MathErrorType.UNKNOWN;
  let message = error.message || 'Unknown error';
  
  if (error.name === 'OverflowError') {
    type = MathErrorType.OVERFLOW;
  } else if (error.name === 'DivisionByZeroError') {
    type = MathErrorType.DIVISION_BY_ZERO;
  } else if (error.name === 'InvalidArgumentError') {
    type = MathErrorType.INVALID_ARGUMENT;
  } else if (error.name === 'PrecisionLossError') {
    type = MathErrorType.PRECISION_LOSS;
  } else if (error.name === 'TimeoutError') {
    type = MathErrorType.TIMEOUT;
  }
  
  return {
    type,
    message,
    details: error.details || {}
  };
}

// Operation handlers for different operation types
const operationHandlers: Record<string, Record<string, (params: any) => any>> = {
  // Universal Number operations
  universal: {
    create: (params: any) => {
      try {
        if (params.fromFactors) {
          return UniversalNumber.fromFactors(params.fromFactors);
        } else if (params.fromNumber !== undefined) {
          return UniversalNumber.fromNumber(params.fromNumber);
        } else if (params.fromString !== undefined) {
          return UniversalNumber.fromString(params.fromString, params.base);
        } else {
          throw new Error('Invalid parameters for universal number creation');
        }
      } catch (error) {
        return { error: handleError(error) };
      }
    },
    
    add: (params: any) => {
      try {
        const a = params.a instanceof UniversalNumber ? params.a : UniversalNumber.fromAny(params.a);
        const b = params.b instanceof UniversalNumber ? params.b : UniversalNumber.fromAny(params.b);
        return a.add(b);
      } catch (error) {
        return { error: handleError(error) };
      }
    },
    
    subtract: (params: any) => {
      try {
        const a = params.a instanceof UniversalNumber ? params.a : UniversalNumber.fromAny(params.a);
        const b = params.b instanceof UniversalNumber ? params.b : UniversalNumber.fromAny(params.b);
        return a.subtract(b);
      } catch (error) {
        return { error: handleError(error) };
      }
    },
    
    multiply: (params: any) => {
      try {
        const a = params.a instanceof UniversalNumber ? params.a : UniversalNumber.fromAny(params.a);
        const b = params.b instanceof UniversalNumber ? params.b : UniversalNumber.fromAny(params.b);
        return a.multiply(b);
      } catch (error) {
        return { error: handleError(error) };
      }
    },
    
    divide: (params: any) => {
      try {
        const a = params.a instanceof UniversalNumber ? params.a : UniversalNumber.fromAny(params.a);
        const b = params.b instanceof UniversalNumber ? params.b : UniversalNumber.fromAny(params.b);
        return a.divide(b);
      } catch (error) {
        return { error: handleError(error) };
      }
    },
    
    toString: (params: any) => {
      try {
        const num = params.number instanceof UniversalNumber ? params.number : UniversalNumber.fromAny(params.number);
        return num.toString(params.base || 10);
      } catch (error) {
        return { error: handleError(error) };
      }
    }
  },
  
  // Prime math operations
  prime: {
    isPrime: (params: any) => {
      try {
        const num = params.number instanceof UniversalNumber ? params.number : UniversalNumber.fromAny(params.number);
        return PrimeMath.isPrime(num);
      } catch (error) {
        return { error: handleError(error) };
      }
    },
    
    factorize: (params: any) => {
      try {
        const num = params.number instanceof UniversalNumber ? params.number : UniversalNumber.fromAny(params.number);
        return PrimeMath.factorize(num);
      } catch (error) {
        return { error: handleError(error) };
      }
    },
    
    gcd: (params: any) => {
      try {
        const a = params.a instanceof UniversalNumber ? params.a : UniversalNumber.fromAny(params.a);
        const b = params.b instanceof UniversalNumber ? params.b : UniversalNumber.fromAny(params.b);
        return PrimeMath.gcd(a, b);
      } catch (error) {
        return { error: handleError(error) };
      }
    },
    
    lcm: (params: any) => {
      try {
        const a = params.a instanceof UniversalNumber ? params.a : UniversalNumber.fromAny(params.a);
        const b = params.b instanceof UniversalNumber ? params.b : UniversalNumber.fromAny(params.b);
        return PrimeMath.lcm(a, b);
      } catch (error) {
        return { error: handleError(error) };
      }
    }
  }
};

// Process message from main thread
ctx.addEventListener('message', (event) => {
  const { id, operation, category, params } = event.data;
  
  try {
    if (!operationHandlers[category] || !operationHandlers[category][operation]) {
      throw new Error(`Invalid operation: ${category}.${operation}`);
    }
    
    const result = operationHandlers[category][operation](params);
    
    ctx.postMessage({
      id,
      result,
      error: null
    });
  } catch (error: any) {
    ctx.postMessage({
      id,
      result: null,
      error: handleError(error)
    });
  }
});

// Signal that the worker is ready
ctx.postMessage({ type: 'ready' });