import { useState, useCallback } from 'react';
import { 
  Parser, 
  Tokenizer, 
  SyntaxHighlighter, 
  AutoCompletion, 
  Evaluator 
} from '../core/expression-engine';
import { 
  ParseResult, 
  SyntaxError, 
  ExpressionSuggestion 
} from '../core/expression-engine/types';

interface UseExpressionEngineResult {
  parseExpression: (expression: string) => void;
  evaluateExpression: (expression: string) => unknown;
  highlightedExpression: string;
  suggestions: ExpressionSuggestion[];
  parsedExpression: ParseResult | null;
  errors: SyntaxError[];
}

/**
 * Hook for using the expression engine in components
 */
export function useExpressionEngine(): UseExpressionEngineResult {
  const [parser] = useState(new Parser());
  const [tokenizer] = useState(new Tokenizer());
  const [highlighter] = useState(new SyntaxHighlighter());
  const [autoCompletion] = useState(new AutoCompletion());
  const [evaluator] = useState(new Evaluator());
  
  const [parsedExpression, setParsedExpression] = useState<ParseResult | null>(null);
  const [highlightedExpression, setHighlightedExpression] = useState('');
  const [suggestions, setSuggestions] = useState<ExpressionSuggestion[]>([]);
  const [errors, setErrors] = useState<SyntaxError[]>([]);
  
  /**
   * Parse an expression and update the state
   */
  const parseExpression = useCallback((expression: string) => {
    // Tokenize for syntax highlighting
    const tokens = tokenizer.tokenize(expression);
    const highlightedTokens = highlighter.highlight(tokens, errors);
    const htmlString = highlighter.renderToHtml('', Array.isArray(highlightedTokens) ? highlightedTokens : []);
    setHighlightedExpression(htmlString);
    
    // Parse for AST and errors
    const parseResult = parser.parse(expression);
    setParsedExpression(parseResult);
    setErrors(parseResult.errors);
    
    // Generate suggestions
    const cursorPosition = expression.length; // Default to end of expression
    const suggestions = autoCompletion.getSuggestions(expression, cursorPosition, parseResult.tokens);
    setSuggestions(suggestions);
  }, [tokenizer, highlighter, parser, autoCompletion, errors]);
  
  /**
   * Evaluate an expression and return the result
   */
  const evaluateExpression = useCallback((expression: string) => {
    const parseResult = parser.parse(expression);
    
    if (parseResult.errors.length > 0 || !parseResult.ast) {
      throw new Error(parseResult.errors[0]?.message || 'Invalid expression');
    }
    
    const result = evaluator.evaluate(parseResult.ast);
    return result.value;
  }, [parser, evaluator]);
  
  return {
    parseExpression,
    evaluateExpression,
    highlightedExpression,
    suggestions,
    parsedExpression,
    errors
  };
}