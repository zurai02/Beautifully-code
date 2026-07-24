/* ═══════════════════════════════════════════════════════════════
   ClaudeCode — Lua / Luau Parser & Beautifier Extension
   Provides advanced Lua/Luau AST parsing and semantic analysis
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════════════════
// LUA TOKENIZER
// ═══════════════════════════════════════════════════════════════

class LuaTokenizer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.tokens = [];
    this.line = 1;
    this.col = 1;
  }

  tokenize() {
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const char = this.source[this.pos];

      if (char === '"' || char === "'") {
        this.readString(char);
      } else if (char === '[' && (this.source[this.pos + 1] === '[' || this.source[this.pos + 1] === '=')) {
        this.readLongString();
      } else if (char === '-' && this.source[this.pos + 1] === '-') {
        this.readComment();
      } else if (/\d/.test(char)) {
        this.readNumber();
      } else if (/[a-zA-Z_]/.test(char)) {
        this.readIdentifier();
      } else if (/[+\-*/%^#<>=~]/.test(char)) {
        this.readOperator();
      } else if (char === '.' && /\d/.test(this.source[this.pos + 1])) {
        this.readNumber();
      } else if (char === '.' && this.source[this.pos + 1] === '.' && this.source[this.pos + 2] === '.') {
        this.tokens.push({ type: 'ELLIPSIS', value: '...', line: this.line, col: this.col });
        this.advance(3);
      } else if (char === '.' && this.source[this.pos + 1] === '.') {
        this.tokens.push({ type: 'CONCAT', value: '..', line: this.line, col: this.col });
        this.advance(2);
      } else if (char === ':') {
        if (this.source[this.pos + 1] === ':') {
          this.tokens.push({ type: 'LABEL', value: '::', line: this.line, col: this.col });
          this.advance(2);
        } else {
          this.tokens.push({ type: 'COLON', value: ':', line: this.line, col: this.col });
          this.advance(1);
        }
      } else {
        const singleCharTokens = {
          '(': 'LPAREN', ')': 'RPAREN', '{': 'LBRACE', '}': 'RBRACE',
          '[': 'LBRACKET', ']': 'RBRACKET', ';': 'SEMICOLON', ',': 'COMMA',
          '.': 'DOT'
        };
        if (singleCharTokens[char]) {
          this.tokens.push({ type: singleCharTokens[char], value: char, line: this.line, col: this.col });
        }
        this.advance(1);
      }
    }
    this.tokens.push({ type: 'EOF', value: '', line: this.line, col: this.col });
    return this.tokens;
  }

  advance(n = 1) {
    for (let i = 0; i < n; i++) {
      if (this.source[this.pos] === '
') { this.line++; this.col = 1; }
      else { this.col++; }
      this.pos++;
    }
  }

  skipWhitespace() {
    while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
      this.advance(1);
    }
  }

  readString(quote) {
    const startLine = this.line;
    const startCol = this.col;
    let value = quote;
    this.advance(1);
    while (this.pos < this.source.length) {
      const c = this.source[this.pos];
      value += c;
      if (c === '\') {
        this.advance(1);
        if (this.pos < this.source.length) {
          value += this.source[this.pos];
          this.advance(1);
        }
      } else if (c === quote) {
        this.advance(1);
        break;
      } else if (c === '
') {
        break; // Unterminated string
      } else {
        this.advance(1);
      }
    }
    this.tokens.push({ type: 'STRING', value, line: startLine, col: startCol });
  }

  readLongString() {
    const startLine = this.line;
    const startCol = this.col;
    let eqCount = 0;
    this.advance(1); // [
    while (this.source[this.pos] === '=') { eqCount++; this.advance(1); }
    this.advance(1); // [
    let value = '[' + '='.repeat(eqCount) + '[';
    const closePattern = ']' + '='.repeat(eqCount) + ']';
    while (this.pos < this.source.length) {
      if (this.source.substring(this.pos, this.pos + closePattern.length) === closePattern) {
        value += closePattern;
        this.advance(closePattern.length);
        break;
      }
      value += this.source[this.pos];
      this.advance(1);
    }
    this.tokens.push({ type: 'STRING', value, line: startLine, col: startCol });
  }

  readComment() {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(2); // --
    let value = '--';
    if (this.source[this.pos] === '[') {
      // Long comment
      let eqCount = 0;
      this.advance(1);
      while (this.source[this.pos] === '=') { eqCount++; this.advance(1); }
      if (this.source[this.pos] === '[') {
        this.advance(1);
        value += '[' + '='.repeat(eqCount) + '[';
        const closePattern = ']' + '='.repeat(eqCount) + ']';
        while (this.pos < this.source.length) {
          if (this.source.substring(this.pos, this.pos + closePattern.length) === closePattern) {
            value += closePattern;
            this.advance(closePattern.length);
            break;
          }
          value += this.source[this.pos];
          this.advance(1);
        }
      } else {
        while (this.pos < this.source.length && this.source[this.pos] !== '
') {
          value += this.source[this.pos];
          this.advance(1);
        }
      }
    } else {
      while (this.pos < this.source.length && this.source[this.pos] !== '
') {
        value += this.source[this.pos];
        this.advance(1);
      }
    }
    this.tokens.push({ type: 'COMMENT', value, line: startLine, col: startCol });
  }

  readNumber() {
    const startLine = this.line;
    const startCol = this.col;
    let value = '';
    // Hex
    if (this.source[this.pos] === '0' && /[xX]/.test(this.source[this.pos + 1])) {
      value += this.source[this.pos]; this.advance(1);
      value += this.source[this.pos]; this.advance(1);
      while (/[0-9a-fA-F]/.test(this.source[this.pos])) { value += this.source[this.pos]; this.advance(1); }
    } else {
      while (/[\d.]/.test(this.source[this.pos]) || /[eE]/.test(this.source[this.pos])) {
        value += this.source[this.pos];
        this.advance(1);
      }
    }
    this.tokens.push({ type: 'NUMBER', value, line: startLine, col: startCol });
  }

  readIdentifier() {
    const startLine = this.line;
    const startCol = this.col;
    let value = '';
    while (/[a-zA-Z0-9_]/.test(this.source[this.pos])) {
      value += this.source[this.pos];
      this.advance(1);
    }
    const keywords = new Set([
      'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
      'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or',
      'repeat', 'return', 'then', 'true', 'until', 'while'
    ]);
    // Luau-specific keywords
    const luauKeywords = new Set(['continue', 'export', 'type', 'typeof']);
    const type = keywords.has(value) || luauKeywords.has(value) ? 'KEYWORD' : 'IDENTIFIER';
    this.tokens.push({ type, value, line: startLine, col: startCol });
  }

  readOperator() {
    const startLine = this.line;
    const startCol = this.col;
    const twoCharOps = ['<=', '>=', '==', '~=', '..', '+=', '-=', '*=', '/='];
    const threeCharOps = ['//='];
    let value = this.source[this.pos];
    const twoChar = value + (this.source[this.pos + 1] || '');
    const threeChar = twoChar + (this.source[this.pos + 2] || '');
    if (threeCharOps.includes(threeChar)) { value = threeChar; this.advance(3); }
    else if (twoCharOps.includes(twoChar)) { value = twoChar; this.advance(2); }
    else { this.advance(1); }
    this.tokens.push({ type: 'OPERATOR', value, line: startLine, col: startCol });
  }
}

// ═══════════════════════════════════════════════════════════════
// LUA AST PARSER
// ═══════════════════════════════════════════════════════════════

class LuaParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.ast = { type: 'Chunk', body: [] };
  }

  parse() {
    while (this.current().type !== 'EOF') {
      const stmt = this.parseStatement();
      if (stmt) this.ast.body.push(stmt);
    }
    return this.ast;
  }

  current() { return this.tokens[this.pos] || { type: 'EOF' }; }
  peek(n = 1) { return this.tokens[this.pos + n] || { type: 'EOF' }; }
  advance() { return this.tokens[this.pos++] || { type: 'EOF' }; }
  expect(type) {
    if (this.current().type !== type) {
      throw new Error(`Expected ${type}, got ${this.current().type} at line ${this.current().line}`);
    }
    return this.advance();
  }

  parseStatement() {
    const tok = this.current();
    switch (tok.type) {
      case 'KEYWORD':
        switch (tok.value) {
          case 'local': return this.parseLocal();
          case 'if': return this.parseIf();
          case 'while': return this.parseWhile();
          case 'repeat': return this.parseRepeat();
          case 'for': return this.parseFor();
          case 'function': return this.parseFunctionDecl();
          case 'do': return this.parseDoBlock();
          case 'return': return this.parseReturn();
          case 'break': this.advance(); return { type: 'BreakStatement' };
          case 'goto': return this.parseGoto();
        }
        break;
      case 'IDENTIFIER':
        return this.parseAssignmentOrCall();
      case 'SEMICOLON':
        this.advance();
        return null;
    }
    // Skip unknown tokens
    this.advance();
    return null;
  }

  parseLocal() {
    this.advance(); // local
    if (this.current().type === 'KEYWORD' && this.current().value === 'function') {
      return this.parseLocalFunction();
    }
    const names = this.parseNameList();
    let values = [];
    if (this.current().type === 'OPERATOR' && this.current().value === '=') {
      this.advance();
      values = this.parseExpressionList();
    }
    return { type: 'LocalDeclaration', names, values };
  }

  parseLocalFunction() {
    this.advance(); // function
    const name = this.expect('IDENTIFIER').value;
    this.expect('LPAREN');
    const params = this.parseParamList();
    this.expect('RPAREN');
    const body = this.parseBlock();
    this.expect('KEYWORD'); // end
    return { type: 'LocalFunctionDeclaration', name, params, body };
  }

  parseFunctionDecl() {
    this.advance(); // function
    const name = this.parseFunctionName();
    this.expect('LPAREN');
    const params = this.parseParamList();
    this.expect('RPAREN');
    const body = this.parseBlock();
    this.expect('KEYWORD'); // end
    return { type: 'FunctionDeclaration', name, params, body };
  }

  parseFunctionName() {
    let name = this.expect('IDENTIFIER').value;
    while (this.current().type === 'DOT') {
      this.advance();
      name += '.' + this.expect('IDENTIFIER').value;
    }
    if (this.current().type === 'COLON') {
      this.advance();
      name += ':' + this.expect('IDENTIFIER').value;
    }
    return name;
  }

  parseParamList() {
    const params = [];
    if (this.current().type === 'ELLIPSIS') {
      this.advance();
      return ['...'];
    }
    while (this.current().type === 'IDENTIFIER') {
      params.push(this.advance().value);
      if (this.current().type === 'COMMA') {
        this.advance();
      } else {
        break;
      }
    }
    if (this.current().type === 'ELLIPSIS') {
      params.push('...');
      this.advance();
    }
    return params;
  }

  parseNameList() {
    const names = [this.expect('IDENTIFIER').value];
    while (this.current().type === 'COMMA') {
      this.advance();
      names.push(this.expect('IDENTIFIER').value);
    }
    return names;
  }

  parseExpressionList() {
    const exprs = [this.parseExpression()];
    while (this.current().type === 'COMMA') {
      this.advance();
      exprs.push(this.parseExpression());
    }
    return exprs;
  }

  parseExpression() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.current().type === 'KEYWORD' && this.current().value === 'or') {
      this.advance();
      left = { type: 'BinaryExpression', operator: 'or', left, right: this.parseAnd() };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseComparison();
    while (this.current().type === 'KEYWORD' && this.current().value === 'and') {
      this.advance();
      left = { type: 'BinaryExpression', operator: 'and', left, right: this.parseComparison() };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseConcat();
    const ops = ['<', '>', '<=', '>=', '==', '~='];
    while (this.current().type === 'OPERATOR' && ops.includes(this.current().value)) {
      const op = this.advance().value;
      left = { type: 'BinaryExpression', operator: op, left, right: this.parseConcat() };
    }
    return left;
  }

  parseConcat() {
    let left = this.parseAddSub();
    while (this.current().type === 'OPERATOR' && this.current().value === '..') {
      this.advance();
      left = { type: 'BinaryExpression', operator: '..', left, right: this.parseAddSub() };
    }
    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (this.current().type === 'OPERATOR' && /[\+\-]/.test(this.current().value)) {
      const op = this.advance().value;
      left = { type: 'BinaryExpression', operator: op, left, right: this.parseMulDiv() };
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();
    while (this.current().type === 'OPERATOR' && /[\*\/%]/.test(this.current().value)) {
      const op = this.advance().value;
      left = { type: 'BinaryExpression', operator: op, left, right: this.parseUnary() };
    }
    return left;
  }

  parseUnary() {
    if (this.current().type === 'OPERATOR' && /[\-\#\~]/.test(this.current().value)) {
      const op = this.advance().value;
      return { type: 'UnaryExpression', operator: op, argument: this.parseUnary() };
    }
    if (this.current().type === 'KEYWORD' && this.current().value === 'not') {
      this.advance();
      return { type: 'UnaryExpression', operator: 'not', argument: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const tok = this.current();
    switch (tok.type) {
      case 'NUMBER':
        this.advance();
        return { type: 'NumericLiteral', value: tok.value };
      case 'STRING':
        this.advance();
        return { type: 'StringLiteral', value: tok.value };
      case 'KEYWORD':
        if (tok.value === 'nil') { this.advance(); return { type: 'NilLiteral' }; }
        if (tok.value === 'true') { this.advance(); return { type: 'BooleanLiteral', value: true }; }
        if (tok.value === 'false') { this.advance(); return { type: 'BooleanLiteral', value: false }; }
        if (tok.value === 'function') {
          this.advance();
          this.expect('LPAREN');
          const params = this.parseParamList();
          this.expect('RPAREN');
          const body = this.parseBlock();
          this.expect('KEYWORD'); // end
          return { type: 'FunctionExpression', params, body };
        }
        break;
      case 'IDENTIFIER':
        return this.parseVariableOrCall();
      case 'ELLIPSIS':
        this.advance();
        return { type: 'VarargExpression' };
      case 'LBRACE':
        return this.parseTable();
      case 'LPAREN':
        this.advance();
        const expr = this.parseExpression();
        this.expect('RPAREN');
        return expr;
    }
    this.advance();
    return { type: 'UnknownExpression', value: tok.value };
  }

  parseVariableOrCall() {
    let base = { type: 'Identifier', name: this.advance().value };
    while (true) {
      if (this.current().type === 'LBRACKET') {
        this.advance();
        const index = this.parseExpression();
        this.expect('RBRACKET');
        base = { type: 'IndexExpression', base, index };
      } else if (this.current().type === 'DOT') {
        this.advance();
        base = { type: 'MemberExpression', base, identifier: this.expect('IDENTIFIER').value };
      } else if (this.current().type === 'COLON') {
        this.advance();
        const method = this.expect('IDENTIFIER').value;
        this.expect('LPAREN');
        const args = this.parseExpressionList();
        this.expect('RPAREN');
        base = { type: 'MethodCallExpression', base, method, arguments: args };
        break;
      } else if (this.current().type === 'LPAREN' || this.current().type === 'STRING' || this.current().type === 'LBRACE') {
        // Function call
        let args = [];
        if (this.current().type === 'LPAREN') {
          this.advance();
          if (this.current().type !== 'RPAREN') {
            args = this.parseExpressionList();
          }
          this.expect('RPAREN');
        } else if (this.current().type === 'STRING') {
          args = [{ type: 'StringLiteral', value: this.advance().value }];
        } else if (this.current().type === 'LBRACE') {
          args = [this.parseTable()];
        }
        base = { type: 'CallExpression', base, arguments: args };
      } else {
        break;
      }
    }
    return base;
  }

  parseTable() {
    this.expect('LBRACE');
    const fields = [];
    while (this.current().type !== 'RBRACE' && this.current().type !== 'EOF') {
      if (this.current().type === 'LBRACKET') {
        this.advance();
        const key = this.parseExpression();
        this.expect('RBRACKET');
        this.expect('OPERATOR'); // =
        const value = this.parseExpression();
        fields.push({ type: 'TableKey', key, value });
      } else if (this.current().type === 'IDENTIFIER' && this.peek().type === 'OPERATOR' && this.peek().value === '=') {
        const key = this.advance().value;
        this.advance(); // =
        const value = this.parseExpression();
        fields.push({ type: 'TableKeyString', key, value });
      } else {
        const value = this.parseExpression();
        fields.push({ type: 'TableValue', value });
      }
      if (this.current().type === 'COMMA' || this.current().type === 'SEMICOLON') {
        this.advance();
      } else {
        break;
      }
    }
    this.expect('RBRACE');
    return { type: 'TableConstructorExpression', fields };
  }

  parseIf() {
    this.advance(); // if
    const condition = this.parseExpression();
    this.expect('KEYWORD'); // then
    const consequent = this.parseBlock();
    const clauses = [];
    while (this.current().type === 'KEYWORD' && this.current().value === 'elseif') {
      this.advance();
      const elseifCond = this.parseExpression();
      this.expect('KEYWORD'); // then
      const elseifBody = this.parseBlock();
      clauses.push({ type: 'ElseifClause', condition: elseifCond, body: elseifBody });
    }
    let alternate = null;
    if (this.current().type === 'KEYWORD' && this.current().value === 'else') {
      this.advance();
      alternate = this.parseBlock();
    }
    this.expect('KEYWORD'); // end
    return { type: 'IfStatement', condition: consequent, test: condition, consequent, clauses, alternate };
  }

  parseWhile() {
    this.advance(); // while
    const condition = this.parseExpression();
    this.expect('KEYWORD'); // do
    const body = this.parseBlock();
    this.expect('KEYWORD'); // end
    return { type: 'WhileStatement', condition, body };
  }

  parseRepeat() {
    this.advance(); // repeat
    const body = this.parseBlock();
    this.expect('KEYWORD'); // until
    const condition = this.parseExpression();
    return { type: 'RepeatStatement', condition, body };
  }

  parseFor() {
    this.advance(); // for
    const name = this.expect('IDENTIFIER').value;
    if (this.current().type === 'OPERATOR' && this.current().value === '=') {
      this.advance(); // =
      const start = this.parseExpression();
      this.expect('COMMA');
      const end = this.parseExpression();
      let step = { type: 'NumericLiteral', value: '1' };
      if (this.current().type === 'COMMA') {
        this.advance();
        step = this.parseExpression();
      }
      this.expect('KEYWORD'); // do
      const body = this.parseBlock();
      this.expect('KEYWORD'); // end
      return { type: 'ForNumericStatement', variable: name, start, end, step, body };
    } else {
      // Generic for
      const variables = [name];
      while (this.current().type === 'COMMA') {
        this.advance();
        variables.push(this.expect('IDENTIFIER').value);
      }
      this.expect('KEYWORD'); // in
      const iterators = this.parseExpressionList();
      this.expect('KEYWORD'); // do
      const body = this.parseBlock();
      this.expect('KEYWORD'); // end
      return { type: 'ForGenericStatement', variables, iterators, body };
    }
  }

  parseDoBlock() {
    this.advance(); // do
    const body = this.parseBlock();
    this.expect('KEYWORD'); // end
    return { type: 'DoStatement', body };
  }

  parseReturn() {
    this.advance(); // return
    const args = [];
    if (this.current().type !== 'EOF' && !(this.current().type === 'KEYWORD' && /end|else|elseif|until/.test(this.current().value))) {
      args.push(this.parseExpression());
      while (this.current().type === 'COMMA') {
        this.advance();
        args.push(this.parseExpression());
      }
    }
    return { type: 'ReturnStatement', arguments: args };
  }

  parseGoto() {
    this.advance(); // goto
    const label = this.expect('IDENTIFIER').value;
    return { type: 'GotoStatement', label };
  }

  parseAssignmentOrCall() {
    const expr = this.parseExpression();
    if (expr.type === 'CallExpression' || expr.type === 'MethodCallExpression') {
      return { type: 'CallStatement', expression: expr };
    }
    // Assignment
    const variables = [expr];
    while (this.current().type === 'COMMA') {
      this.advance();
      variables.push(this.parseExpression());
    }
    this.expect('OPERATOR'); // =
    const values = this.parseExpressionList();
    return { type: 'AssignmentStatement', variables, values };
  }

  parseBlock() {
    const body = [];
    while (this.current().type !== 'EOF') {
      if (this.current().type === 'KEYWORD' && /end|else|elseif|until/.test(this.current().value)) {
        break;
      }
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    return body;
  }
}

// ═══════════════════════════════════════════════════════════════
// LUA AST TO STRING (Beautifier)
// ═══════════════════════════════════════════════════════════════

class LuaBeautifier {
  constructor(ast, indent = '  ') {
    this.ast = ast;
    this.indent = indent;
    this.level = 0;
  }

  beautify() {
    return this.ast.body.map(stmt => this.statementToString(stmt)).join('
');
  }

  statementToString(stmt) {
    const ind = this.indent.repeat(this.level);
    switch (stmt.type) {
      case 'LocalDeclaration':
        return ind + 'local ' + stmt.names.join(', ') + (stmt.values.length ? ' = ' + stmt.values.map(e => this.exprToString(e)).join(', ') : '');
      case 'LocalFunctionDeclaration':
        return ind + 'local function ' + stmt.name + '(' + stmt.params.join(', ') + ')
' + this.blockToString(stmt.body) + '
' + ind + 'end';
      case 'FunctionDeclaration':
        return ind + 'function ' + stmt.name + '(' + stmt.params.join(', ') + ')
' + this.blockToString(stmt.body) + '
' + ind + 'end';
      case 'IfStatement':
        let s = ind + 'if ' + this.exprToString(stmt.test) + ' then
' + this.blockToString(stmt.consequent);
        for (const clause of (stmt.clauses || [])) {
          s += '
' + ind + 'elseif ' + this.exprToString(clause.condition) + ' then
' + this.blockToString(clause.body);
        }
        if (stmt.alternate) {
          s += '
' + ind + 'else
' + this.blockToString(stmt.alternate);
        }
        s += '
' + ind + 'end';
        return s;
      case 'WhileStatement':
        return ind + 'while ' + this.exprToString(stmt.condition) + ' do
' + this.blockToString(stmt.body) + '
' + ind + 'end';
      case 'RepeatStatement':
        return ind + 'repeat
' + this.blockToString(stmt.body) + '
' + ind + 'until ' + this.exprToString(stmt.condition);
      case 'ForNumericStatement':
        return ind + 'for ' + stmt.variable + ' = ' + this.exprToString(stmt.start) + ', ' + this.exprToString(stmt.end) + ', ' + this.exprToString(stmt.step) + ' do
' + this.blockToString(stmt.body) + '
' + ind + 'end';
      case 'ForGenericStatement':
        return ind + 'for ' + stmt.variables.join(', ') + ' in ' + stmt.iterators.map(e => this.exprToString(e)).join(', ') + ' do
' + this.blockToString(stmt.body) + '
' + ind + 'end';
      case 'DoStatement':
        return ind + 'do
' + this.blockToString(stmt.body) + '
' + ind + 'end';
      case 'ReturnStatement':
        return ind + 'return' + (stmt.arguments.length ? ' ' + stmt.arguments.map(e => this.exprToString(e)).join(', ') : '');
      case 'BreakStatement':
        return ind + 'break';
      case 'GotoStatement':
        return ind + 'goto ' + stmt.label;
      case 'CallStatement':
        return ind + this.exprToString(stmt.expression);
      case 'AssignmentStatement':
        return ind + stmt.variables.map(e => this.exprToString(e)).join(', ') + ' = ' + stmt.values.map(e => this.exprToString(e)).join(', ');
      default:
        return ind + '-- [unknown: ' + stmt.type + ']';
    }
  }

  blockToString(body) {
    this.level++;
    const result = body.map(stmt => this.statementToString(stmt)).join('
');
    this.level--;
    return result;
  }

  exprToString(expr) {
    if (!expr) return 'nil';
    switch (expr.type) {
      case 'Identifier': return expr.name;
      case 'NumericLiteral': return expr.value;
      case 'StringLiteral': return expr.value;
      case 'BooleanLiteral': return expr.value ? 'true' : 'false';
      case 'NilLiteral': return 'nil';
      case 'VarargExpression': return '...';
      case 'BinaryExpression':
        return this.exprToString(expr.left) + ' ' + expr.operator + ' ' + this.exprToString(expr.right);
      case 'UnaryExpression':
        return expr.operator + ' ' + this.exprToString(expr.argument);
      case 'CallExpression':
        return this.exprToString(expr.base) + '(' + expr.arguments.map(a => this.exprToString(a)).join(', ') + ')';
      case 'MethodCallExpression':
        return this.exprToString(expr.base) + ':' + expr.method + '(' + expr.arguments.map(a => this.exprToString(a)).join(', ') + ')';
      case 'IndexExpression':
        return this.exprToString(expr.base) + '[' + this.exprToString(expr.index) + ']';
      case 'MemberExpression':
        return this.exprToString(expr.base) + '.' + expr.identifier;
      case 'FunctionExpression':
        return 'function(' + expr.params.join(', ') + ')
' + this.blockToString(expr.body) + '
' + this.indent.repeat(this.level) + 'end';
      case 'TableConstructorExpression':
        const fields = expr.fields.map(f => {
          if (f.type === 'TableKey') return '[' + this.exprToString(f.key) + '] = ' + this.exprToString(f.value);
          if (f.type === 'TableKeyString') return f.key + ' = ' + this.exprToString(f.value);
          return this.exprToString(f.value);
        });
        return '{' + (fields.length ? ' ' + fields.join(', ') + ' ' : '') + '}';
      default:
        return JSON.stringify(expr);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// LUA DEOBFUSCATOR
// ═══════════════════════════════════════════════════════════════

class LuaDeobfuscator {
  static deobfuscate(code) {
    let out = code;
    // Remove unnecessary semicolons
    out = out.replace(/;\s*
/g, '
');
    // Fix spacing around operators
    out = out.replace(/([=+\-*/%<>~])/g, ' $1 ');
    out = out.replace(/\s{2,}/g, ' ');
    // Try to parse and re-beautify
    try {
      const tokenizer = new LuaTokenizer(out);
      const tokens = tokenizer.tokenize();
      const parser = new LuaParser(tokens);
      const ast = parser.parse();
      const beautifier = new LuaBeautifier(ast);
      return beautifier.beautify();
    } catch (e) {
      // Fallback to simple beautifier
      return out;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.LuaTokenizer = LuaTokenizer;
  window.LuaParser = LuaParser;
  window.LuaBeautifier = LuaBeautifier;
  window.LuaDeobfuscator = LuaDeobfuscator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LuaTokenizer, LuaParser, LuaBeautifier, LuaDeobfuscator };
}
