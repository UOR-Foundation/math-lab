/**
 * Expression engine type definitions
 */

// Expression token types
export enum TokenType {
  Number = 'NUMBER',
  Operator = 'OPERATOR',
  Function = 'FUNCTION',
  LeftParen = 'LEFT_PAREN',
  RightParen = 'RIGHT_PAREN',
  Variable = 'VARIABLE',
  Whitespace = 'WHITESPACE',
  Unknown = 'UNKNOWN',
}

// Expression token
export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

// Syntax highlighting styles
export interface SyntaxStyles {
  [TokenType.Number]: string;
  [TokenType.Operator]: string;
  [TokenType.Function]: string;
  [TokenType.LeftParen]: string;
  [TokenType.RightParen]: string;
  [TokenType.Variable]: string;
  [TokenType.Unknown]: string;
  [TokenType.Whitespace]: string;
  error: string;
}

// Token with syntax highlighting information
export interface TokenWithStyle extends Token {
  style: string;
}

// AST node types
export enum NodeType {
  Number = 'NUMBER',
  BinaryOperation = 'BINARY_OPERATION',
  UnaryOperation = 'UNARY_OPERATION',
  FunctionCall = 'FUNCTION_CALL',
  Variable = 'VARIABLE',
}

// Base AST node
export interface ASTNode {
  type: NodeType;
}

// Number node
export interface NumberNode extends ASTNode {
  type: NodeType.Number;
  value: string;
}

// Binary operation node
export interface BinaryOperationNode extends ASTNode {
  type: NodeType.BinaryOperation;
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

// Unary operation node
export interface UnaryOperationNode extends ASTNode {
  type: NodeType.UnaryOperation;
  operator: string;
  argument: ASTNode;
}

// Function call node
export interface FunctionCallNode extends ASTNode {
  type: NodeType.FunctionCall;
  name: string;
  arguments: ASTNode[];
}

// Variable node
export interface VariableNode extends ASTNode {
  type: NodeType.Variable;
  name: string;
}

// Expression syntax error
export interface SyntaxError {
  message: string;
  position: number;
}

// Parser result
export interface ParseResult {
  tokens: Token[];
  ast?: ASTNode;
  errors: SyntaxError[];
}

// Expression evaluation context
export interface EvaluationContext {
  variables: Record<string, any>;
  functions: Record<string, (...args: any[]) => any>;
}

// Expression evaluation result
export interface EvaluationResult {
  value: any;
  error?: string;
}

// Expression suggestion
export interface ExpressionSuggestion {
  text: string;
  displayText: string;
  type: 'function' | 'variable' | 'operator' | 'constant';
  description?: string;
}