/**
 * Integration between the math-js adapter and the expression engine
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createUniversalNumber, isPrime, factorize, gcd, lcm } from './index';
import { ExpressionEngine, defaultContext, EvaluationContext, ExpressionSuggestion, ExpressionValue } from '../expression-engine';

/**
 * Expression function wrapper to handle async operations
 * @param fn The async function to wrap
 * @returns A sync function that returns a Promise
 */
function wrapAsyncFunction<T>(fn: (...args: any[]) => Promise<T>): (...args: ExpressionValue[]) => ExpressionValue {
  return (...args: ExpressionValue[]) => {
    return fn(...args);
  };
}

/**
 * Create an enhanced evaluation context with math-js functions
 */
export function createMathJsContext(): EvaluationContext {
  return {
    variables: {
      ...defaultContext.variables,
      // Add any additional constants here
    },
    functions: {
      ...defaultContext.functions,
      
      // Universal number creation
      universal: wrapAsyncFunction(async (value: any) => {
        return await createUniversalNumber(value);
      }),
      
      // Prime check
      isPrime: wrapAsyncFunction(async (value: any) => {
        return await isPrime(value);
      }),
      
      // Factorization
      factorize: wrapAsyncFunction(async (value: any) => {
        return await factorize(value);
      }),
      
      // GCD calculation
      gcd: wrapAsyncFunction(async (a: any, b: any) => {
        return await gcd(a, b);
      }),
      
      // LCM calculation
      lcm: wrapAsyncFunction(async (a: any, b: any) => {
        return await lcm(a, b);
      })
    }
  };
}

/**
 * Math-js related suggestions for auto-completion
 */
export const mathJsSuggestions: ExpressionSuggestion[] = [
  { 
    text: 'universal(', 
    displayText: 'universal', 
    type: 'function', 
    description: 'Create a universal number' 
  },
  { 
    text: 'isPrime(', 
    displayText: 'isPrime', 
    type: 'function', 
    description: 'Check if a number is prime' 
  },
  { 
    text: 'factorize(', 
    displayText: 'factorize', 
    type: 'function', 
    description: 'Find prime factorization' 
  },
  { 
    text: 'gcd(', 
    displayText: 'gcd', 
    type: 'function', 
    description: 'Calculate greatest common divisor' 
  },
  { 
    text: 'lcm(', 
    displayText: 'lcm', 
    type: 'function', 
    description: 'Calculate least common multiple' 
  }
];

/**
 * Create an expression engine with math-js integration
 */
export function createMathJsExpressionEngine(): ExpressionEngine {
  // Create context with math-js functions
  const context = createMathJsContext();
  
  // Create expression engine with the enhanced context
  return new ExpressionEngine({
    context,
    additionalSuggestions: mathJsSuggestions
  });
}

/**
 * Initialize math-js integration with the expression engine
 * @returns Enhanced expression engine with math-js capabilities
 */
export function initializeMathJsIntegration(): ExpressionEngine {
  return createMathJsExpressionEngine();
}

/**
 * Evaluate an expression using the math-js integrated engine
 * @param expression - The expression to evaluate
 * @returns Evaluation result
 */
export async function evaluateMathJsExpression(expression: string): Promise<any> {
  const engine = createMathJsExpressionEngine();
  const result = engine.evaluate(expression);
  
  // Handle promises in results (from async math-js functions)
  if (result.value && typeof result.value === 'object' && 'then' in result.value && typeof result.value.then === 'function') {
    try {
      result.value = await result.value;
    } catch (error: any) {
      result.error = error.message;
      result.value = null;
    }
  }
  
  return result;
}