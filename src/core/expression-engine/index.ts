import { Parser } from './parser';
import { SyntaxHighlighter } from './syntax-highlighter';
import { Evaluator, defaultContext } from './evaluator';
import { AutoCompletionProvider } from './auto-completion';
import {
  EvaluationContext,
  SyntaxStyles,
  ExpressionSuggestion,
  ParseResult,
  EvaluationResult,
  TokenWithStyle,
  ExpressionValue
} from './types';

/**
 * Expression engine options
 */
export interface ExpressionEngineOptions {
  context?: Partial<EvaluationContext>;
  syntaxStyles?: Partial<SyntaxStyles>;
  additionalSuggestions?: ExpressionSuggestion[];
}

/**
 * History entry type
 */
export interface HistoryEntry {
  expression: string;
  result: ExpressionValue;
  timestamp: number;
}

/**
 * Expression engine for parsing, evaluating, and interacting with mathematical expressions
 */
export class ExpressionEngine {
  private parser: Parser;
  private syntaxHighlighter: SyntaxHighlighter;
  private evaluator: Evaluator;
  private autoCompletionProvider: AutoCompletionProvider;
  
  // Cache for parsed expressions
  private parseCache: Map<string, ParseResult> = new Map();
  
  // History of expressions and results
  private history: HistoryEntry[] = [];

  /**
   * Create a new expression engine
   * @param options - Engine configuration options
   */
  constructor(options: ExpressionEngineOptions = {}) {
    this.parser = new Parser();
    this.syntaxHighlighter = new SyntaxHighlighter(options.syntaxStyles);
    this.evaluator = new Evaluator(options.context);
    this.autoCompletionProvider = new AutoCompletionProvider(options.additionalSuggestions);
  }

  /**
   * Parse an expression
   * @param expression - The expression to parse
   * @param useCache - Whether to use cached results (default: true)
   * @returns The parse result
   */
  public parse(expression: string, useCache: boolean = true): ParseResult {
    // Check cache first if enabled
    if (useCache && this.parseCache.has(expression)) {
      return this.parseCache.get(expression)!;
    }
    
    // Parse the expression
    const result = this.parser.parse(expression);
    
    // Cache the result if enabled
    if (useCache && expression.trim().length > 0) {
      this.parseCache.set(expression, result);
    }
    
    return result;
  }

  /**
   * Evaluate an expression
   * @param expression - The expression to evaluate
   * @param addToHistory - Whether to add the result to history (default: true)
   * @returns The evaluation result
   */
  public evaluate(expression: string, addToHistory: boolean = true): EvaluationResult {
    // Parse the expression
    const parseResult = this.parse(expression);
    
    // If there are syntax errors, return an error result
    if (parseResult.errors.length > 0) {
      return {
        value: null,
        error: parseResult.errors.map(e => e.message).join('; ')
      };
    }
    
    // No AST to evaluate
    if (!parseResult.ast) {
      return {
        value: null,
        error: 'Invalid expression'
      };
    }
    
    // Evaluate the AST
    const result = this.evaluator.evaluate(parseResult.ast);
    
    // Add to history if enabled and successful
    if (addToHistory && !result.error) {
      this.addToHistory(expression, result.value);
    }
    
    return result;
  }

  /**
   * Get syntax highlighting for an expression
   * @param expression - The expression to highlight
   * @returns Tokens with style information
   */
  public highlightSyntax(expression: string): TokenWithStyle[] {
    // Parse the expression to get tokens and errors
    const { tokens, errors } = this.parse(expression);
    
    // Apply syntax highlighting
    return this.syntaxHighlighter.highlight(tokens, errors);
  }

  /**
   * Render highlighted expression as HTML
   * @param expression - The expression to highlight
   * @returns HTML string with styled spans
   */
  public renderHighlightedHtml(expression: string): string {
    const highlightedTokens = this.highlightSyntax(expression);
    return this.syntaxHighlighter.renderToHtml(expression, highlightedTokens);
  }

  /**
   * Get auto-completion suggestions for an expression
   * @param expression - The current expression
   * @param cursorPosition - The cursor position in the expression
   * @returns Relevant suggestions
   */
  public getSuggestions(expression: string, cursorPosition: number): ExpressionSuggestion[] {
    // Parse the expression to get tokens
    const { tokens } = this.parse(expression);
    
    // Get suggestions based on context
    return this.autoCompletionProvider.getSuggestions(expression, cursorPosition, tokens);
  }

  /**
   * Add an expression and its result to history
   * @param expression - The evaluated expression
   * @param result - The evaluation result
   */
  private addToHistory(expression: string, result: ExpressionValue): void {
    this.history.unshift({
      expression,
      result,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
  }

  /**
   * Get expression evaluation history
   * @returns Array of expression history entries
   */
  public getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Clear expression history
   */
  public clearHistory(): void {
    this.history = [];
  }

  /**
   * Clear the parse cache
   */
  public clearCache(): void {
    this.parseCache.clear();
  }

  /**
   * Update the evaluation context
   * @param context - New context values to merge with existing context
   */
  public updateContext(context: Partial<EvaluationContext>): void {
    this.evaluator = new Evaluator({
      variables: { 
        ...defaultContext.variables, 
        ...context.variables 
      },
      functions: { 
        ...defaultContext.functions, 
        ...context.functions 
      }
    });
    
    // Clear cache since context changed
    this.clearCache();
  }
}

// Export types and constants
export * from './types';
export { defaultContext } from './evaluator';
export { defaultSyntaxStyles } from './syntax-highlighter';
export { defaultSuggestions } from './auto-completion';