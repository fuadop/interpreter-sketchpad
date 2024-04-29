// @ts-check

class TokenType {
	static EOF = 'EOF'

	static PLUS = 'PLUS'
	static MINUS = 'MINUS'
	static MODULO = 'MODULO'
	static DIVIDE = 'DIVIDE'
	static MULTIPLY = 'MULTIPLY'

	static LPAREN = 'LPAREN'
	static RPAREN = 'RPAREN'

	static NUMBER = 'NUMBER'
}

class Token {
	/** @type {TokenType} */
	type = TokenType.EOF

	/** @type {string} */
	literal = ''

	/**
	 * @param {TokenType} type
	 * @param {string} literal
	 */
	constructor(type, literal) {
		this.type = type;
		this.literal = literal;
	}
}

class Lexer {
	_c = '';
	_pos = 0;
	_next_pos = 0;

	/**
	 *
	 * @param {string} input
	 */
	constructor(input) {
		this.input = input;

		this.next();
	}

	/**
	 *
	 * @returns {Token}
	 */
	nextToken() {
		let literal = this.readChar();

		this.next();

		if (typeof literal == 'string') {
			switch (literal) {
				case '+':
					return new Token(TokenType.PLUS, literal);
				case '-':
					return new Token(TokenType.MINUS, literal);
				case '%':
					return new Token(TokenType.MODULO, literal);
				case '/':
					return new Token(TokenType.DIVIDE, literal);
				case '*':
					return new Token(TokenType.MULTIPLY, literal);
				case '(':
					return new Token(TokenType.LPAREN, literal);
				case ')':
					return new Token(TokenType.RPAREN, literal);
			}

			// validate the NUMBER token
			if (isNaN(+literal))
				throw new Error(`Invalid NUMBER token "${literal}"`);

			return new Token(TokenType.NUMBER, literal);
		}

		return new Token(TokenType.EOF, '');
	}

	readChar() {
		while (this._next_pos <= this.input.length) {
			this.eatWhitespace();

			switch (this._c) {
				case '+':
				case '-':
				case '%':
				case '/':
				case '*':
				case '(':
				case ')':
					return this._c;
				default:
					return this.readNumber();
			}
		}
	}

	readNumber() {
		let start = this._pos;
		while (this.isNumberComponent(this.peek())) {
			this.next();
		}

		return this.input.substring(start, this._pos + 1);
	}

	/**
	 * @param {string} ch
	 * @returns {boolean}
	 */
	isNumberComponent(ch) {
		return ch == '.' || (ch >= '0' && ch <= '9');
	}

	next() {
		this._pos = this._next_pos;

		this._next_pos++;
		this._c = this.input[this._pos];
	}

	peek() {
		return this.input[this._next_pos];
	}

	eatWhitespace() {
		while (this.isWhitespace(this._c)) {
			this.next();
		}
	}

	/**
	 * @param {string} ch
	 * @returns {boolean}
	 */
	isWhitespace(ch) {
		return ch == ' ' || ch == '\n' || ch == '\t';
	}
}

class Expression {
	/**
	 *
	 * @param {Token} token
	 */
	constructor(token) {
		this.token = token;
	}

	print() {
		return this.token.literal;
	}
}

class NumberExpression extends Expression {
	/** @type {number} */
	value;

	/**
	 *
	 * @param {Token} token
	 */
	constructor(token) {
		super(token);

		if (token.type !== TokenType.NUMBER)
			throw new Error(`expected "NUMBER" but got "${token.type}"`);

		this.value = parseFloat(token.literal);
	}

	print() {
		return this.token.literal;
	}
}

class PrefixExpression extends Expression {
	/** @type {string} */
	op;
	/** @type {Expression} */
	rhs;

	/**
	 *
	 * @param {Parser} parser
	 */
	constructor(parser) {
		super(parser._token);

		this.op = this.token.literal;

		let _precedence = parser.currentPrecedence();

		parser.next();

		this.rhs = parser.parse(_precedence);
	}

	print() {
		return `(${this.op}${this.rhs.print()})`;
	}
}

class InfixExpression extends Expression {
	/** @type {string} */
	op;
	/** @type {Expression} */
	lhs;
	/** @type {Expression} */
	rhs;

	/**
	 *
	 * @param {Parser} parser
	 * @param {Expression} lhs
	 */
	constructor(lhs, parser) {
		super(parser._token);

		this.op = this.token.literal;

		let _precedence = parser.currentPrecedence();

		parser.next();

		this.lhs = lhs;
		this.rhs = parser.parse(_precedence);
	}

	print() {
		return `(${this.lhs.print()} ${this.op} ${this.rhs.print()})`;
	}
}

class TokenPrecedence {
	/**
	 * @static
	 * @param {TokenType} type
	 */
	static get(type) {
		switch (type) {
			case TokenType.MODULO:
				return 9;
			case TokenType.DIVIDE:
				return 8;
			case TokenType.MULTIPLY:
				return 7;
			// case TokenType.PLUS:
			// 	return 6;
			// case TokenType.MINUS:
			// 	return 5;
			case TokenType.EOF:
			case TokenType.LPAREN:
			case TokenType.RPAREN:
				return -1; // should always exit immediately
			default:
				return 1;
		};
	}
}

// LL(1) Parser
class Parser {
	/** @type {Token} */
	_token;

	/** @type {Token} */
	_next_token;

	/**
	 *
	 * @param {Lexer} lexer
	 */
	constructor(lexer) {
		this.lexer = lexer;

		// load the pointers
		this.next();
		this.next();
	}

	/**
	 *
	 * @params {number} [p] - Precendence | Binding Power
	 * @returns {Expression}
	 */
	parse(p = 0) {
		let lhs;

		switch (this._token.type) {
			case TokenType.LPAREN:
				lhs = this.parseGroup();
				break;
			case TokenType.PLUS:
			case TokenType.MINUS:
			case TokenType.MODULO:
			case TokenType.DIVIDE:
			case TokenType.MULTIPLY:
				lhs = new PrefixExpression(this);
				break;
			default:
				lhs = new NumberExpression(this._token);
		}

		while (p < this.nextPrecedence()) {
			this.next();

			switch (this._token.type) {
				case TokenType.PLUS:
				case TokenType.MINUS:
				case TokenType.MODULO:
				case TokenType.DIVIDE:
				case TokenType.MULTIPLY:
					lhs = new InfixExpression(lhs, this);
					break;
				default:
					throw new Error(`expected operator but got "${this._token.type}"`);
			}
		}

		return lhs;
	}

	/**
	 *
	 * @returns {Expression}
	 */
	parseGroup() {
		let e, _precedence = this.currentPrecedence();

		// move away from left paren
		this.next();

		e = this.parse(_precedence);

		// this should be a right paren
		this.expect(TokenType.RPAREN);

		// @ts-ignore
		return e;
	}

	next() {
		this._token = this._next_token;
		this._next_token = this.lexer.nextToken();
	}

	/**
	 *
	 * @param {TokenType} type
	 */
	expect(type) {
		if (this._next_token.type === type) return this.next();

		throw new Error(`expected "${type}" but got "${this._next_token.type}"`);
	}

	nextPrecedence() {
		return TokenPrecedence.get(this._next_token.type);
	}

	currentPrecedence() {
		return TokenPrecedence.get(this._token.type);
	}
}

const lexer = new Lexer('-2 + 4.5 * 7 - -8');

// console.log(lexer.nextToken());
// console.log(lexer.nextToken());
// console.log(lexer.nextToken());
// console.log(lexer.nextToken());
// console.log(lexer.nextToken());
// console.log(lexer.nextToken());
// console.log(lexer.nextToken());
// console.log(lexer.nextToken());
// console.log(lexer.nextToken());

const parser = new Parser(lexer);
const exp = parser.parse();

console.log(exp);
console.log(exp.print());

