import { 
  ASTNode, 
  Token, 
  TokenType, 
  NodeType,
  NumberNode,
  BinaryOperationNode,
  UnaryOperationNode,
  FunctionCallNode,
  VariableNode,
  ParseResult,
  SyntaxError
} from './types';
import { Tokenizer } from './tokenizer';

/**
 * Recursive descent parser for mathematical expressions
 */
export class Parser {
  private tokens: Token[] = [];
  private currentTokenIndex: number = 0;
  private errors: SyntaxError[] = [];
  private tokenizer: Tokenizer;

  constructor() {
    this.tokenizer = new Tokenizer();
  }

  /**
   * Parse a mathematical expression string into an AST
   * @param expression - The expression to parse
   * @returns Parse result including tokens, AST, and errors
   */
  public parse(expression: string): ParseResult {
    this.errors = [];
    
    // Tokenize the expression
    this.tokens = this.tokenizer.tokenize(expression)
      .filter(token => token.type !== TokenType.Whitespace); // Ignore whitespace tokens for parsing
    
    this.currentTokenIndex = 0;
    
    // Empty expression
    if (this.tokens.length === 0) {
      return {
        tokens: this.tokenizer.tokenize(expression), // Return all tokens including whitespace
        errors: []
      };
    }

    try {
      // Start parsing from the expression rule
      const ast = this.parseExpression();
      
      // Check if we've consumed all tokens
      if (this.currentTokenIndex < this.tokens.length) {
        this.addError(`Unexpected token: ${this.tokens[this.currentTokenIndex].value}`, 
          this.tokens[this.currentTokenIndex].start);
      }
      
      return {
        tokens: this.tokenizer.tokenize(expression), // Return all tokens including whitespace
        ast: this.errors.length === 0 ? ast : undefined,
        errors: this.errors
      };
    } catch (error) {
      // Catch any runtime errors during parsing
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      this.addError(errorMessage, this.currentToken()?.start ?? 0);
      
      return {
        tokens: this.tokenizer.tokenize(expression),
        errors: this.errors
      };
    }
  }

  /**
   * Expression parsing - lowest precedence: +, -
   */
  private parseExpression(): ASTNode {
    let left = this.parseTerm();

    while (
      this.currentTokenIndex < this.tokens.length && 
      this.currentToken().type === TokenType.Operator && 
      ['+', '-'].includes(this.currentToken().value)
    ) {
      const operator = this.currentToken().value;
      this.advance();
      
      const right = this.parseTerm();
      
      left = {
        type: NodeType.BinaryOperation,
        operator,
        left,
        right
      } as BinaryOperationNode;
    }

    return left;
  }

  /**
   * Term parsing - medium precedence: *, /, %
   */
  private parseTerm(): ASTNode {
    let left = this.parseFactor();

    while (
      this.currentTokenIndex < this.tokens.length && 
      this.currentToken().type === TokenType.Operator && 
      ['*', '/', '%'].includes(this.currentToken().value)
    ) {
      const operator = this.currentToken().value;
      this.advance();
      
      const right = this.parseFactor();
      
      left = {
        type: NodeType.BinaryOperation,
        operator,
        left,
        right
      } as BinaryOperationNode;
    }

    return left;
  }

  /**
   * Factor parsing - high precedence: ^
   */
  private parseFactor(): ASTNode {
    let left = this.parsePrimary();

    while (
      this.currentTokenIndex < this.tokens.length && 
      this.currentToken().type === TokenType.Operator && 
      this.currentToken().value === '^'
    ) {
      const operator = this.currentToken().value;
      this.advance();
      
      const right = this.parsePrimary();
      
      left = {
        type: NodeType.BinaryOperation,
        operator,
        left,
        right
      } as BinaryOperationNode;
    }

    return left;
  }

  /**
   * Primary expression parsing - highest precedence: atoms (numbers, variables, functions, parenthesized expressions)
   */
  private parsePrimary(): ASTNode {
    const token = this.currentToken();

    // Handle unary operators: +, -
    if (token.type === TokenType.Operator && ['+', '-'].includes(token.value)) {
      const operator = token.value;
      this.advance();
      
      const argument = this.parsePrimary();
      
      return {
        type: NodeType.UnaryOperation,
        operator,
        argument
      } as UnaryOperationNode;
    }

    // Handle numbers
    if (token.type === TokenType.Number) {
      this.advance();
      
      return {
        type: NodeType.Number,
        value: token.value
      } as NumberNode;
    }

    // Handle variables
    if (token.type === TokenType.Variable) {
      const name = token.value;
      this.advance();
      
      return {
        type: NodeType.Variable,
        name
      } as VariableNode;
    }

    // Handle function calls
    if (token.type === TokenType.Function) {
      const name = token.value;
      this.advance();
      
      // Expect left parenthesis
      if (this.currentTokenIndex >= this.tokens.length || 
          this.currentToken().type !== TokenType.LeftParen) {
        this.addError(`Expected '(' after function name '${name}'`, 
          this.currentTokenIndex < this.tokens.length ? this.currentToken().start : token.end + 1);
        
        // Return a partial function call node to continue parsing
        return {
          type: NodeType.FunctionCall,
          name,
          arguments: []
        } as FunctionCallNode;
      }
      
      this.advance(); // Consume left parenthesis
      
      // Parse function arguments
      const args: ASTNode[] = [];
      
      // Empty argument list
      if (this.currentTokenIndex < this.tokens.length && 
          this.currentToken().type === TokenType.RightParen) {
        this.advance(); // Consume right parenthesis
        
        return {
          type: NodeType.FunctionCall,
          name,
          arguments: args
        } as FunctionCallNode;
      }
      
      // Parse arguments separated by commas
      while (true) {
        args.push(this.parseExpression());
        
        // Check for comma or right parenthesis
        if (this.currentTokenIndex >= this.tokens.length) {
          this.addError(`Expected ')' or ',' in function arguments`, token.end + 1);
          break;
        }
        
        if (this.currentToken().type === TokenType.RightParen) {
          this.advance(); // Consume right parenthesis
          break;
        }
        
        // Expect comma between arguments
        if (this.currentToken().value !== ',') {
          this.addError(`Expected ',' between function arguments`, this.currentToken().start);
          // Try to recover by assuming a comma
        } else {
          this.advance(); // Consume comma
        }
      }
      
      return {
        type: NodeType.FunctionCall,
        name,
        arguments: args
      } as FunctionCallNode;
    }

    // Handle parenthesized expressions
    if (token.type === TokenType.LeftParen) {
      this.advance(); // Consume left parenthesis
      
      const expr = this.parseExpression();
      
      // Expect right parenthesis
      if (this.currentTokenIndex >= this.tokens.length || 
          this.currentToken().type !== TokenType.RightParen) {
        this.addError(`Expected ')'`, 
          this.currentTokenIndex < this.tokens.length ? this.currentToken().start : token.end + 1);
      } else {
        this.advance(); // Consume right parenthesis
      }
      
      return expr;
    }

    // Unexpected token
    this.addError(`Unexpected token: ${token.value}`, token.start);
    this.advance(); // Skip the problematic token to try to continue parsing
    
    // Return a placeholder node to continue parsing
    return {
      type: NodeType.Number,
      value: '0'
    } as NumberNode;
  }

  /**
   * Get the current token
   */
  private currentToken(): Token {
    return this.tokens[this.currentTokenIndex];
  }

  /**
   * Advance to the next token
   */
  private advance(): void {
    this.currentTokenIndex++;
  }

  /**
   * Add a syntax error
   */
  private addError(message: string, position: number): void {
    this.errors.push({ message, position });
  }
}