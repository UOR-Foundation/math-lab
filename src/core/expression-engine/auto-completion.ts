import { ExpressionSuggestion, Token, TokenType } from './types';

/**
 * Default suggestions for auto-completion
 */
export const defaultSuggestions: ExpressionSuggestion[] = [
  // Mathematical constants
  { text: 'pi', displayText: 'π', type: 'constant', description: 'Pi (3.14159...)' },
  { text: 'e', displayText: 'e', type: 'constant', description: 'Euler\'s number (2.71828...)' },
  
  // Basic operators
  { text: '+', displayText: '+', type: 'operator', description: 'Addition' },
  { text: '-', displayText: '-', type: 'operator', description: 'Subtraction' },
  { text: '*', displayText: '×', type: 'operator', description: 'Multiplication' },
  { text: '/', displayText: '÷', type: 'operator', description: 'Division' },
  { text: '^', displayText: '^', type: 'operator', description: 'Exponentiation' },
  { text: '%', displayText: '%', type: 'operator', description: 'Modulo' },
  
  // Trigonometric functions
  { text: 'sin(', displayText: 'sin', type: 'function', description: 'Sine function' },
  { text: 'cos(', displayText: 'cos', type: 'function', description: 'Cosine function' },
  { text: 'tan(', displayText: 'tan', type: 'function', description: 'Tangent function' },
  { text: 'asin(', displayText: 'asin', type: 'function', description: 'Inverse sine function' },
  { text: 'acos(', displayText: 'acos', type: 'function', description: 'Inverse cosine function' },
  { text: 'atan(', displayText: 'atan', type: 'function', description: 'Inverse tangent function' },
  
  // Hyperbolic functions
  { text: 'sinh(', displayText: 'sinh', type: 'function', description: 'Hyperbolic sine function' },
  { text: 'cosh(', displayText: 'cosh', type: 'function', description: 'Hyperbolic cosine function' },
  { text: 'tanh(', displayText: 'tanh', type: 'function', description: 'Hyperbolic tangent function' },
  
  // Logarithmic functions
  { text: 'log(', displayText: 'log', type: 'function', description: 'Base-10 logarithm' },
  { text: 'ln(', displayText: 'ln', type: 'function', description: 'Natural logarithm' },
  { text: 'log2(', displayText: 'log2', type: 'function', description: 'Base-2 logarithm' },
  
  // Other common functions
  { text: 'sqrt(', displayText: '√', type: 'function', description: 'Square root' },
  { text: 'abs(', displayText: 'abs', type: 'function', description: 'Absolute value' },
  { text: 'exp(', displayText: 'exp', type: 'function', description: 'Exponential function (e^x)' },
  
  // Number theory functions
  { text: 'gcd(', displayText: 'gcd', type: 'function', description: 'Greatest common divisor' },
  { text: 'lcm(', displayText: 'lcm', type: 'function', description: 'Least common multiple' },
  { text: 'factorial(', displayText: 'factorial', type: 'function', description: 'Factorial (n!)' },
  { text: 'isPrime(', displayText: 'isPrime', type: 'function', description: 'Check if a number is prime' },
  
  // Rounding functions
  { text: 'floor(', displayText: 'floor', type: 'function', description: 'Round down to nearest integer' },
  { text: 'ceil(', displayText: 'ceil', type: 'function', description: 'Round up to nearest integer' },
  { text: 'round(', displayText: 'round', type: 'function', description: 'Round to nearest integer' }
];

/**
 * Auto-completion provider for mathematical expressions
 */
export class AutoCompletionProvider {
  private suggestions: ExpressionSuggestion[];

  /**
   * Create a new auto-completion provider
   * @param customSuggestions - Optional additional suggestions
   */
  constructor(customSuggestions: ExpressionSuggestion[] = []) {
    this.suggestions = [...defaultSuggestions, ...customSuggestions];
  }

  /**
   * Get suggestions based on current expression and cursor position
   * @param expression - The current expression text
   * @param cursorPosition - The cursor position in the expression
   * @param tokens - Optional tokens from the already parsed expression
   * @returns Array of relevant suggestions
   */
  public getSuggestions(
    expression: string, 
    cursorPosition: number, 
    tokens: Token[] = []
  ): ExpressionSuggestion[] {
    // Get the token at cursor position or the token before it
    const tokenAtCursor = this.findTokenAtPosition(tokens, cursorPosition);
    
    // The text to match against suggestions
    let prefix = '';
    
    // If cursor is at a token, use the partial token text as prefix
    if (tokenAtCursor) {
      // Only use the part of the token up to the cursor position
      prefix = expression.substring(tokenAtCursor.start, cursorPosition).toLowerCase();
      
      // Special case for functions: only match the function name before the opening parenthesis
      if (tokenAtCursor.type === TokenType.Function && prefix.includes('(')) {
        prefix = prefix.substring(0, prefix.indexOf('('));
      }
    } else {
      // Get the word fragment at cursor position
      prefix = this.getWordAtPosition(expression, cursorPosition).toLowerCase();
    }

    // Context-aware filtering based on current token and previous tokens
    return this.filterSuggestionsByContext(prefix, tokenAtCursor, tokens, cursorPosition);
  }

  /**
   * Filter suggestions based on prefix and context
   * @param prefix - The text prefix to match
   * @param currentToken - The token at or before cursor
   * @param allTokens - All tokens in the expression
   * @param cursorPosition - The cursor position
   * @returns Filtered suggestions
   */
  private filterSuggestionsByContext(
    prefix: string, 
    currentToken: Token | null, 
    allTokens: Token[], 
    cursorPosition: number
  ): ExpressionSuggestion[] {
    // Start with prefix filtering
    let filteredSuggestions = this.suggestions.filter(suggestion =>
      suggestion.text.toLowerCase().startsWith(prefix)
    );

    // Context-aware filtering
    if (currentToken) {
      switch (currentToken.type) {
        case TokenType.Operator:
          // After an operator, suggest variables, functions, or constants, but not other operators
          filteredSuggestions = filteredSuggestions.filter(s => 
            s.type === 'function' || s.type === 'variable' || s.type === 'constant'
          );
          break;
          
        case TokenType.Function:
        case TokenType.Variable:
          // If we're in the middle of typing a function or variable, only show matching ones
          filteredSuggestions = filteredSuggestions.filter(s => 
            s.type === 'function' || s.type === 'variable' || s.type === 'constant'
          );
          break;
          
        case TokenType.LeftParen:
          // After an opening parenthesis, suggest variables, functions, or constants
          filteredSuggestions = filteredSuggestions.filter(s => 
            s.type === 'function' || s.type === 'variable' || s.type === 'constant'
          );
          break;
          
        default:
          // Default case - no additional filtering
          break;
      }
    } else {
      // At the beginning of expression or after whitespace, prefer functions and variables
      const previousToken = this.findTokenBeforePosition(allTokens, cursorPosition);
      
      if (!previousToken) {
        // At the beginning, suggest everything
      } else if (previousToken.type === TokenType.Operator || previousToken.type === TokenType.LeftParen) {
        // After operator or opening parenthesis, suggest variables, functions, or constants
        filteredSuggestions = filteredSuggestions.filter(s => 
          s.type === 'function' || s.type === 'variable' || s.type === 'constant'
        );
      } else if (previousToken.type === TokenType.Number || previousToken.type === TokenType.RightParen) {
        // After a number or closing parenthesis, suggest operators
        filteredSuggestions = filteredSuggestions.filter(s => s.type === 'operator');
      }
    }

    // Sort suggestions by relevance
    return this.sortSuggestionsByRelevance(filteredSuggestions, prefix);
  }

  /**
   * Sort suggestions by relevance to the input
   * @param suggestions - The suggestions to sort
   * @param prefix - The prefix to sort by
   * @returns Sorted suggestions
   */
  private sortSuggestionsByRelevance(
    suggestions: ExpressionSuggestion[], 
    prefix: string
  ): ExpressionSuggestion[] {
    return [...suggestions].sort((a, b) => {
      // Exact matches come first
      if (a.text.toLowerCase() === prefix && b.text.toLowerCase() !== prefix) return -1;
      if (b.text.toLowerCase() === prefix && a.text.toLowerCase() !== prefix) return 1;
      
      // Then sort by length (shorter suggestions first)
      return a.text.length - b.text.length;
    });
  }

  /**
   * Find the token at a specific position
   * @param tokens - The tokens to search
   * @param position - The position to find
   * @returns The token at position or null
   */
  private findTokenAtPosition(tokens: Token[], position: number): Token | null {
    for (const token of tokens) {
      if (position >= token.start && position <= token.end + 1) {
        return token;
      }
    }
    return null;
  }

  /**
   * Find the token before a specific position
   * @param tokens - The tokens to search
   * @param position - The position to find tokens before
   * @returns The token before position or null
   */
  private findTokenBeforePosition(tokens: Token[], position: number): Token | null {
    let closestToken: Token | null = null;
    let closestDistance = Infinity;
    
    for (const token of tokens) {
      if (token.end < position) {
        const distance = position - token.end;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestToken = token;
        }
      }
    }
    
    return closestToken;
  }

  /**
   * Get the word at a specific position in text
   * @param text - The text to search
   * @param position - The position to find the word at
   * @returns The word at position
   */
  private getWordAtPosition(text: string, position: number): string {
    // Find the start of the word
    let start = position;
    while (start > 0 && this.isIdentifierChar(text[start - 1])) {
      start--;
    }
    
    // Find the end of the word
    let end = position;
    while (end < text.length && this.isIdentifierChar(text[end])) {
      end++;
    }
    
    return text.substring(start, end);
  }

  /**
   * Check if a character is a valid identifier character (letter, digit, or underscore)
   * @param char - The character to check
   * @returns True if the character is a valid identifier character
   */
  private isIdentifierChar(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }
}