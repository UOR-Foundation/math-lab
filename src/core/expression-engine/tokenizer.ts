import { Token, TokenType } from './types';

/**
 * Tokenizer for mathematical expressions
 */
export class Tokenizer {
  private static readonly OPERATORS = ['+', '-', '*', '/', '^', '%', '=', '!', '<', '>', '&', '|'];
  private static readonly WHITESPACE = /\s/;
  private static readonly DIGIT = /[0-9]/;
  private static readonly LETTER = /[a-zA-Z]/;
  private static readonly KNOWN_FUNCTIONS = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
    'log', 'ln', 'exp', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'gcd', 'lcm'
  ];

  /**
   * Tokenize an expression string into tokens
   * @param expression - The expression to tokenize
   * @returns Array of tokens
   */
  public tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while (pos < expression.length) {
      const char = expression[pos];

      // Process whitespace
      if (Tokenizer.WHITESPACE.test(char)) {
        const start = pos;
        while (pos < expression.length && Tokenizer.WHITESPACE.test(expression[pos])) {
          pos++;
        }
        tokens.push({
          type: TokenType.Whitespace,
          value: expression.substring(start, pos),
          start,
          end: pos - 1
        });
        continue;
      }

      // Process numbers
      if (Tokenizer.DIGIT.test(char) || (char === '.' && pos + 1 < expression.length && Tokenizer.DIGIT.test(expression[pos + 1]))) {
        const start = pos;
        let hasDecimal = char === '.';
        
        pos++; // Move past the first digit or decimal point
        
        // Continue reading digits and at most one decimal point
        while (
          pos < expression.length && 
          (Tokenizer.DIGIT.test(expression[pos]) || 
           (!hasDecimal && expression[pos] === '.'))
        ) {
          if (expression[pos] === '.') {
            hasDecimal = true;
          }
          pos++;
        }

        // Scientific notation (e.g., 1.23e-4)
        if (pos < expression.length && (expression[pos] === 'e' || expression[pos] === 'E')) {
          pos++; // Move past 'e' or 'E'
          
          // Optional sign for exponent
          if (pos < expression.length && (expression[pos] === '+' || expression[pos] === '-')) {
            pos++;
          }
          
          // There must be at least one digit in the exponent
          if (pos < expression.length && Tokenizer.DIGIT.test(expression[pos])) {
            while (pos < expression.length && Tokenizer.DIGIT.test(expression[pos])) {
              pos++;
            }
          } else {
            // Invalid scientific notation, roll back to before 'e'/'E'
            pos = pos - (expression[pos-1] === '+' || expression[pos-1] === '-' ? 2 : 1);
          }
        }

        tokens.push({
          type: TokenType.Number,
          value: expression.substring(start, pos),
          start,
          end: pos - 1
        });
        continue;
      }

      // Process operators
      if (Tokenizer.OPERATORS.includes(char)) {
        // Check for multi-character operators (e.g., '<=', '>=', '==', '!=', '&&', '||')
        let operatorLength = 1;
        const nextChar = expression[pos + 1];
        
        // Check for two-character operators
        if (nextChar && (
            (char === '<' && nextChar === '=') ||
            (char === '>' && nextChar === '=') ||
            (char === '=' && nextChar === '=') ||
            (char === '!' && nextChar === '=') ||
            (char === '&' && nextChar === '&') ||
            (char === '|' && nextChar === '|')
        )) {
          operatorLength = 2;
        }

        tokens.push({
          type: TokenType.Operator,
          value: expression.substring(pos, pos + operatorLength),
          start: pos,
          end: pos + operatorLength - 1
        });
        
        pos += operatorLength;
        continue;
      }

      // Process parentheses
      if (char === '(') {
        tokens.push({
          type: TokenType.LeftParen,
          value: '(',
          start: pos,
          end: pos
        });
        pos++;
        continue;
      }
      
      if (char === ')') {
        tokens.push({
          type: TokenType.RightParen,
          value: ')',
          start: pos,
          end: pos
        });
        pos++;
        continue;
      }

      // Process identifiers (variables and functions)
      if (Tokenizer.LETTER.test(char) || char === '_') {
        const start = pos;
        
        while (
          pos < expression.length && 
          (Tokenizer.LETTER.test(expression[pos]) || 
           Tokenizer.DIGIT.test(expression[pos]) || 
           expression[pos] === '_')
        ) {
          pos++;
        }
        
        const identifier = expression.substring(start, pos);
        
        // Check if this is a known function followed by a left parenthesis
        // Skip any whitespace between function name and opening parenthesis
        let currentPos = pos;
        while (currentPos < expression.length && Tokenizer.WHITESPACE.test(expression[currentPos])) {
          currentPos++;
        }
        
        const isFunction = 
          currentPos < expression.length && 
          expression[currentPos] === '(' && 
          (Tokenizer.KNOWN_FUNCTIONS.includes(identifier) || 
           // Consider any identifier followed by an opening parenthesis as a function
           true);
        
        tokens.push({
          type: isFunction ? TokenType.Function : TokenType.Variable,
          value: identifier,
          start,
          end: pos - 1
        });
        
        continue;
      }

      // Unknown character
      tokens.push({
        type: TokenType.Unknown,
        value: char,
        start: pos,
        end: pos
      });
      pos++;
    }

    return tokens;
  }
}