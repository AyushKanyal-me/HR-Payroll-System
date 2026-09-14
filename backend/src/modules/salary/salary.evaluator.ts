import { BadRequestError } from '../../utils/errors.js';

type TokenType = 'NUMBER' | 'IDENT' | 'PLUS' | 'MINUS' | 'MUL' | 'DIV' | 'LPAREN' | 'RPAREN' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export class SafeFormulaEvaluator {
  private static tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const clean = formula.trim();

    if (!clean) {
      throw new BadRequestError('Formula cannot be empty');
    }

    while (i < clean.length) {
      const char = clean[i]!;

      // Whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Operators & Parentheses
      if (char === '+') {
        tokens.push({ type: 'PLUS', value: '+', pos: i++ });
        continue;
      }
      if (char === '-') {
        tokens.push({ type: 'MINUS', value: '-', pos: i++ });
        continue;
      }
      if (char === '*') {
        tokens.push({ type: 'MUL', value: '*', pos: i++ });
        continue;
      }
      if (char === '/') {
        tokens.push({ type: 'DIV', value: '/', pos: i++ });
        continue;
      }
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', pos: i++ });
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', pos: i++ });
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        let numStr = '';
        const startPos = i;
        while (i < clean.length && /[0-9.]/.test(clean[i]!)) {
          numStr += clean[i];
          i++;
        }
        if (numStr.split('.').length > 2) {
          throw new BadRequestError(`Invalid number format '${numStr}' at position ${startPos}`);
        }
        tokens.push({ type: 'NUMBER', value: numStr, pos: startPos });
        continue;
      }

      // Identifiers (e.g. BASIC, GROSS, WAGE, HRA, WORKED_DAYS)
      if (/[A-Za-z_]/.test(char)) {
        let identStr = '';
        const startPos = i;
        while (i < clean.length && /[A-Za-z0-9_]/.test(clean[i]!)) {
          identStr += clean[i];
          i++;
        }
        tokens.push({ type: 'IDENT', value: identStr.toUpperCase(), pos: startPos });
        continue;
      }

      // Any other character is strictly forbidden
      throw new BadRequestError(`Invalid character '${char}' in formula at position ${i}`);
    }

    tokens.push({ type: 'EOF', value: '', pos: i });
    return tokens;
  }

  /**
   * Validates syntax of an arithmetic formula using recursive descent parsing.
   * Optionally checks that all identifiers are in the allowedIdentifiers list.
   */
  public static validateFormulaSyntax(formula: string, allowedIdentifiers?: string[]): boolean {
    try {
      this.validate(formula, allowedIdentifiers);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates formula syntax and throws BadRequestError with details if invalid.
   */
  public static validate(formula: string, allowedIdentifiers?: string[]): { identifiers: string[] } {
    const tokens = this.tokenize(formula);
    if (tokens.length <= 1) {
      throw new BadRequestError('Formula is empty');
    }

    let current = 0;
    const identifiers: string[] = [];
    const allowedSet = allowedIdentifiers
      ? new Set(allowedIdentifiers.map((id) => id.toUpperCase()))
      : null;

    function peek(): Token {
      return tokens[current]!;
    }

    function consume(expectedType?: TokenType): Token {
      const tok = tokens[current]!;
      if (expectedType && tok.type !== expectedType) {
        throw new BadRequestError(
          `Syntax error: Expected ${expectedType} but got ${tok.type} ('${tok.value}') at position ${tok.pos}`
        );
      }
      current++;
      return tok;
    }

    function parsePrimary() {
      const tok = peek();
      if (tok.type === 'NUMBER') {
        consume('NUMBER');
        return;
      }
      if (tok.type === 'IDENT') {
        const idTok = consume('IDENT');
        const varName = idTok.value;
        if (allowedSet && !allowedSet.has(varName)) {
          throw new BadRequestError(`Unknown identifier '${varName}' at position ${idTok.pos}`);
        }
        identifiers.push(varName);
        return;
      }
      if (tok.type === 'LPAREN') {
        consume('LPAREN');
        parseExpr();
        consume('RPAREN');
        return;
      }
      throw new BadRequestError(`Unexpected token '${tok.value}' at position ${tok.pos}`);
    }

    function parseFactor() {
      const tok = peek();
      if (tok.type === 'PLUS' || tok.type === 'MINUS') {
        consume();
        parsePrimary();
        return;
      }
      parsePrimary();
    }

    function parseTerm() {
      parseFactor();
      while (peek().type === 'MUL' || peek().type === 'DIV') {
        consume();
        parseFactor();
      }
    }

    function parseExpr() {
      parseTerm();
      while (peek().type === 'PLUS' || peek().type === 'MINUS') {
        consume();
        parseTerm();
      }
    }

    parseExpr();

    if (peek().type !== 'EOF') {
      const remaining = peek();
      throw new BadRequestError(`Unexpected trailing token '${remaining.value}' at position ${remaining.pos}`);
    }

    return { identifiers };
  }

  public static evaluate(formula: string, context: Record<string, number>): number {
    const tokens = this.tokenize(formula);
    let current = 0;

    // Build case-insensitive context map
    const normalizedContext: Record<string, number> = {};
    for (const [k, v] of Object.entries(context)) {
      normalizedContext[k.toUpperCase()] = v;
    }

    function peek(): Token {
      return tokens[current]!;
    }

    function consume(expectedType?: TokenType): Token {
      const tok = tokens[current]!;
      if (expectedType && tok.type !== expectedType) {
        throw new BadRequestError(
          `Formula syntax error: Expected ${expectedType} but got ${tok.type} ('${tok.value}') at position ${tok.pos}`
        );
      }
      current++;
      return tok;
    }

    function parsePrimary(): number {
      const tok = peek();

      if (tok.type === 'NUMBER') {
        consume('NUMBER');
        return parseFloat(tok.value);
      }

      if (tok.type === 'IDENT') {
        consume('IDENT');
        const varName = tok.value.toUpperCase();
        if (varName in normalizedContext && typeof normalizedContext[varName] === 'number' && !isNaN(normalizedContext[varName]!)) {
          return normalizedContext[varName]!;
        }
        throw new BadRequestError(
          `Unknown variable or unresolved dependency '${tok.value}' in salary rule formula at position ${tok.pos}`
        );
      }

      if (tok.type === 'LPAREN') {
        consume('LPAREN');
        const val = parseExpr();
        consume('RPAREN');
        return val;
      }

      throw new BadRequestError(
        `Unexpected token '${tok.value}' in formula calculation at position ${tok.pos}`
      );
    }

    function parseFactor(): number {
      const tok = peek();
      if (tok.type === 'PLUS') {
        consume('PLUS');
        return parsePrimary();
      }
      if (tok.type === 'MINUS') {
        consume('MINUS');
        return -parsePrimary();
      }
      return parsePrimary();
    }

    function parseTerm(): number {
      let left = parseFactor();

      while (peek().type === 'MUL' || peek().type === 'DIV') {
        const op = consume();
        const right = parseFactor();

        if (op.type === 'MUL') {
          left = left * right;
        } else if (op.type === 'DIV') {
          if (right === 0) {
            throw new BadRequestError('Division by zero in salary rule formula calculation');
          }
          left = left / right;
        }
      }

      return left;
    }

    function parseExpr(): number {
      let left = parseTerm();

      while (peek().type === 'PLUS' || peek().type === 'MINUS') {
        const op = consume();
        const right = parseTerm();

        if (op.type === 'PLUS') {
          left = left + right;
        } else if (op.type === 'MINUS') {
          left = left - right;
        }
      }

      return left;
    }

    const result = parseExpr();

    if (peek().type !== 'EOF') {
      const remaining = peek();
      throw new BadRequestError(
        `Unexpected trailing token '${remaining.value}' at position ${remaining.pos}`
      );
    }

    if (isNaN(result) || !isFinite(result)) {
      throw new BadRequestError('Formula evaluated to non-finite or NaN value');
    }

    return Number(result.toFixed(2));
  }
}
