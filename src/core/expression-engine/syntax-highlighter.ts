import { Token, TokenType, SyntaxStyles, TokenWithStyle, SyntaxError } from './types';

/**
 * Default syntax highlighting styles using CSS classes
 */
export const defaultSyntaxStyles: SyntaxStyles = {
  [TokenType.Number]: 'expression-number',
  [TokenType.Operator]: 'expression-operator',
  [TokenType.Function]: 'expression-function',
  [TokenType.LeftParen]: 'expression-paren',
  [TokenType.RightParen]: 'expression-paren',
  [TokenType.Variable]: 'expression-variable',
  [TokenType.Unknown]: 'expression-unknown',
  [TokenType.Whitespace]: 'expression-whitespace',
  error: 'expression-error'
};

/**
 * Syntax highlighter for mathematical expressions
 */
export class SyntaxHighlighter {
  private styles: SyntaxStyles;

  /**
   * Create a new syntax highlighter
   * @param styles - Optional custom styles
   */
  constructor(styles: Partial<SyntaxStyles> = {}) {
    this.styles = { ...defaultSyntaxStyles, ...styles };
  }

  /**
   * Highlight a tokenized expression
   * @param tokens - The tokens to highlight
   * @param errors - Optional syntax errors to mark
   * @returns Tokens with style information
   */
  public highlight(tokens: Token[], errors: SyntaxError[] = []): TokenWithStyle[] | string {
    // Map tokens to positions with errors
    const errorPositions: Record<number, boolean> = {};
    
    for (const error of errors) {
      errorPositions[error.position] = true;
    }

    // Apply styles to tokens
    return tokens.map(token => {
      // Check if any position in the token's range is marked as an error
      const hasError = Array.from(
        { length: token.end - token.start + 1 }, 
        (_, i) => token.start + i
      ).some(pos => errorPositions[pos]);
      
      return {
        ...token,
        style: hasError ? this.styles.error : this.styles[token.type]
      };
    });
  }

  /**
   * Render highlighted expression as HTML
   * @param expression - The original expression
   * @param highlightedTokens - The tokens with style information
   * @returns HTML string with spans for styling
   */
  public renderToHtml(expression: string, highlightedTokens: TokenWithStyle[]): string {
    // Sort tokens by start position to ensure correct rendering
    const sortedTokens = [...highlightedTokens].sort((a, b) => a.start - b.start);
    
    // Build HTML with styled spans
    let html = '';
    let lastEnd = 0;
    
    for (const token of sortedTokens) {
      // Add any text between tokens
      if (token.start > lastEnd) {
        html += expression.substring(lastEnd, token.start);
      }
      
      // Add styled token
      html += `<span class="${token.style}">${expression.substring(token.start, token.end + 1)}</span>`;
      lastEnd = token.end + 1;
    }
    
    // Add any remaining text
    if (lastEnd < expression.length) {
      html += expression.substring(lastEnd);
    }
    
    return html;
  }
}