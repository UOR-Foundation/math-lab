import {
  ASTNode,
  NodeType,
  NumberNode,
  BinaryOperationNode,
  UnaryOperationNode,
  FunctionCallNode,
  VariableNode,
  EvaluationContext,
  EvaluationResult,
  ExpressionValue
} from './types';

/**
 * Default evaluation context with standard functions and variables
 */
export const defaultContext: EvaluationContext = {
  variables: {
    pi: Math.PI,
    e: Math.E
  },
  functions: {
    // Trigonometric functions
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    
    // Hyperbolic functions
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    
    // Logarithmic functions
    log: Math.log10,
    ln: Math.log,
    log2: Math.log2,
    
    // Exponential function
    exp: Math.exp,
    
    // Other mathematical functions
    sqrt: Math.sqrt,
    abs: Math.abs,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    
    // Additional utility functions
    gcd: (a: number, b: number): number => {
      a = Math.abs(a as number);
      b = Math.abs(b as number);
      
      while (b > 0) {
        const temp = b;
        b = a % b;
        a = temp;
      }
      
      return a;
    },
    
    lcm: (a: number, b: number): number => {
      const gcdVal = defaultContext.functions.gcd(a, b) as number;
      return Math.abs((a as number) * (b as number)) / gcdVal;
    },
    
    factorial: (n: number): number => {
      if (n < 0 || !Number.isInteger(n)) {
        throw new Error('Factorial is only defined for non-negative integers');
      }
      
      let result = 1;
      for (let i = 2; i <= n; i++) {
        result *= i;
      }
      
      return result;
    },
    
    isPrime: (n: number): boolean => {
      if (n <= 1 || !Number.isInteger(n)) return false;
      if (n <= 3) return true;
      if (n % 2 === 0 || n % 3 === 0) return false;
      
      const limit = Math.sqrt(n);
      for (let i = 5; i <= limit; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
      }
      
      return true;
    }
  }
};

/**
 * Expression evaluator
 */
export class Evaluator {
  private context: EvaluationContext;

  /**
   * Create a new evaluator
   * @param customContext - Optional custom evaluation context
   */
  constructor(customContext: Partial<EvaluationContext> = {}) {
    this.context = {
      variables: { ...defaultContext.variables, ...customContext.variables },
      functions: { ...defaultContext.functions, ...customContext.functions }
    };
  }

  /**
   * Evaluate an AST node
   * @param node - The AST node to evaluate
   * @returns The evaluation result
   */
  public evaluate(node: ASTNode): EvaluationResult {
    try {
      const value = this.evaluateNode(node);
      return { value };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : 'Unknown evaluation error'
      };
    }
  }

  /**
   * Recursively evaluate an AST node
   * @param node - The node to evaluate
   * @returns The evaluated value
   */
  private evaluateNode(node: ASTNode): ExpressionValue {
    switch (node.type) {
      case NodeType.Number:
        return this.evaluateNumber(node as NumberNode);
        
      case NodeType.BinaryOperation:
        return this.evaluateBinaryOperation(node as BinaryOperationNode);
        
      case NodeType.UnaryOperation:
        return this.evaluateUnaryOperation(node as UnaryOperationNode);
        
      case NodeType.FunctionCall:
        return this.evaluateFunctionCall(node as FunctionCallNode);
        
      case NodeType.Variable:
        return this.evaluateVariable(node as VariableNode);
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Evaluate a number node
   * @param node - The number node
   * @returns The numeric value
   */
  private evaluateNumber(node: NumberNode): number {
    return parseFloat(node.value);
  }

  /**
   * Evaluate a binary operation node
   * @param node - The binary operation node
   * @returns The result of the operation
   */
  private evaluateBinaryOperation(node: BinaryOperationNode): ExpressionValue {
    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);
    
    // Type narrowing for numeric operations
    const numericLeft = left as number;
    const numericRight = right as number;
    
    switch (node.operator) {
      case '+': return numericLeft + numericRight;
      case '-': return numericLeft - numericRight;
      case '*': return numericLeft * numericRight;
      case '/':
        if (numericRight === 0) {
          throw new Error('Division by zero');
        }
        return numericLeft / numericRight;
      case '^': return Math.pow(numericLeft, numericRight);
      case '%':
        if (numericRight === 0) {
          throw new Error('Modulo by zero');
        }
        return numericLeft % numericRight;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return numericLeft < numericRight;
      case '>': return numericLeft > numericRight;
      case '<=': return numericLeft <= numericRight;
      case '>=': return numericLeft >= numericRight;
      case '&&': return Boolean(left) && Boolean(right);
      case '||': return Boolean(left) || Boolean(right);
      default:
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }

  /**
   * Evaluate a unary operation node
   * @param node - The unary operation node
   * @returns The result of the operation
   */
  private evaluateUnaryOperation(node: UnaryOperationNode): ExpressionValue {
    const argument = this.evaluateNode(node.argument);
    
    switch (node.operator) {
      case '+': return +(argument as number);
      case '-': return -(argument as number);
      case '!': return !argument;
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  /**
   * Evaluate a function call node
   * @param node - The function call node
   * @returns The result of the function call
   */
  private evaluateFunctionCall(node: FunctionCallNode): ExpressionValue {
    const func = this.context.functions[node.name];
    
    if (!func) {
      throw new Error(`Unknown function: ${node.name}`);
    }
    
    // Evaluate all arguments
    const args = node.arguments.map(arg => this.evaluateNode(arg));
    
    // Call the function with the evaluated arguments
    return func(...args);
  }

  /**
   * Evaluate a variable node
   * @param node - The variable node
   * @returns The variable value
   */
  private evaluateVariable(node: VariableNode): ExpressionValue {
    const value = this.context.variables[node.name];
    
    if (value === undefined) {
      throw new Error(`Unknown variable: ${node.name}`);
    }
    
    return value;
  }
}