import {
  ASTNode,
  NodeType,
  NumberNode,
  BinaryOperationNode,
  UnaryOperationNode,
  FunctionCallNode,
  VariableNode,
  EvaluationContext,
  EvaluationResult
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
      a = Math.abs(a);
      b = Math.abs(b);
      
      while (b > 0) {
        const temp = b;
        b = a % b;
        a = temp;
      }
      
      return a;
    },
    
    lcm: (a: number, b: number): number => {
      const gcd = defaultContext.functions.gcd(a, b);
      return Math.abs(a * b) / gcd;
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
  private evaluateNode(node: ASTNode): any {
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
  private evaluateBinaryOperation(node: BinaryOperationNode): any {
    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);
    
    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/':
        if (right === 0) {
          throw new Error('Division by zero');
        }
        return left / right;
      case '^': return Math.pow(left, right);
      case '%':
        if (right === 0) {
          throw new Error('Modulo by zero');
        }
        return left % right;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '&&': return left && right;
      case '||': return left || right;
      default:
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }

  /**
   * Evaluate a unary operation node
   * @param node - The unary operation node
   * @returns The result of the operation
   */
  private evaluateUnaryOperation(node: UnaryOperationNode): any {
    const argument = this.evaluateNode(node.argument);
    
    switch (node.operator) {
      case '+': return +argument;
      case '-': return -argument;
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
  private evaluateFunctionCall(node: FunctionCallNode): any {
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
  private evaluateVariable(node: VariableNode): any {
    const value = this.context.variables[node.name];
    
    if (value === undefined) {
      throw new Error(`Unknown variable: ${node.name}`);
    }
    
    return value;
  }
}