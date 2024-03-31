// @ts-check
class Token {
	type;
	literal;

	/** 
	* @param {string} type
	* @param {string} literal
	*/
	constructor(type, literal) {
		this.type = type;
		this.literal = literal;
	}
}

class TokenType {
	// operators
	static PLUS = 'PLUS';
	static MINUS = 'MINUS';
	static DIVIDE = 'DIVIDE';
	static MODULO = 'MODULO';
	static MULTIPLY = 'MULTIPLY';

	// variable
	static NUMBER = 'NUMBER';
}

class TokenPrecedence {
	static PLUS = 0;
	static MINUS = 0;
	static NUMBER = 0;

	static DIVIDE = 1;
	static MODULO = 1;
	static MULTIPLY = 1;

	/**
	 *
	 * @param {Token} token
	 * @returns {number}
	 */
	static get(token) {
		switch (token.type) {
			case TokenType.PLUS:
			case TokenType.MINUS:
			case TokenType.NUMBER:
				return TokenPrecedence.NUMBER;

			case TokenType.DIVIDE:
			case TokenType.MODULO:
			case TokenType.MULTIPLY:
				return TokenPrecedence.MULTIPLY;
		}

		return 0;
	}
}

class Lexer {
	/** @type {string} */
	ch;

	token_types = {
		'+': TokenType.PLUS,
		'-': TokenType.MINUS,
		'/': TokenType.DIVIDE,
		'%': TokenType.MODULO,
		'*': TokenType.MULTIPLY,
	};

	/** @param {string} input */
	constructor(input) {
		this.input = input;

		// create pointers
		this.pos = 0;
		this.next_pos = 0;
	}

	next_token() {
		if (this.next_pos >= this.input.length) return null;

		this.read_char();
		this.eat_whitespace();

		return new Token(
			this.token_types[this.ch] ?? TokenType.NUMBER,
			this.ch
		);
	}

	read_char() {
		this.ch = this.input[this.next_pos];
		this.pos = this.next_pos;
		this.next_pos += 1;
	}

	eat_whitespace() {
		while (this.ch?.trim() == '') {
			this.read_char();
		}
	}
}

class Expression {
	/** @type {string} */
	type;

	/** @param {string} type */
	constructor(type) {
		this.type = type;
	}

	print() {
		return '';
	}
}

class NumberExpression extends Expression {
	/** @type {Token} */
	token;

	/** @param {Token} token */
	constructor(token) {
		super('NUMBER');

		this.token = token;
	}

	print() {
		return this.token.literal;
	}
}

// class PrefixExpression extends Expression {
// 	/** @type {Token} */
// 	token;
// 	/** @type {Expression} */
// 	right;
//
// 	/** 
// 	 *
// 	 * @param {Parser} parser 
// 	 */
// 	constructor(parser) {
// 		super('PREFIX');
//
// 		this.token = parser.token;
// 		this.right = parser.parse_expression();
// 	}
//
// 	print() {
// 		return `${this.token.literal} ${this.right.print()}`; 
// 	}
// }

// class InfixExpression extends Expression {
// 	/** @type {Token} */
// 	token;
//
// 	/** @type {Expression} */
// 	left;
// 	/** @type {Expression} */
// 	right;
//
// 	/** 
// 	 *
// 	 * @param {Parser} parser 
// 	 */
// 	constructor(parser) {
// 		super('INFIX');
//
// 		this.left = new NumberExpression(parser);
//
// 		parser.move_pointer();
//
// 		this.token = parser.token;
// 		this.right = parser.parse_expression();
// 	}
//
// 	print() {
// 		return `(${this.left.print()} ${this.token.literal} ${this.right.print()})`;
// 	}
// }

class InfixExpression extends Expression {
	/** @type {Token} */
	token;

	/** @type {Expression} */
	left;
	/** @type {Expression} */
	right;

	/** 
	 *
	 * @param {Token} token 
	 * @param {Expression} left 
	 * @param {Expression} right 
	 */
	constructor(token, left, right) {
		super('INFIX');

		this.left = left;
		this.right = right;

		this.token = token;
	}

	print() {
		return `(${this.left.print()} ${this.token.literal} ${this.right.print()})`;
	}
}

class NullExpression extends Expression {
	constructor() {
		super('NULL');
	}
}

// LL(1) parser - can lookhead 1 time only
class Parser {
	/** @type {Token} */
	token; // current token
	/** @type {Token} */
	next_token; // next token (lookahead)

	/** @param {Lexer} lexer */
	constructor(lexer) {
		this.lexer = lexer;

		// pre-load the next_pointer
		this.move_pointer();
	}

	/**
	* @returns {Expression}
	*/
	parse_expression() {
		this.move_pointer();
		return this.parse_expression_w_precedence(this.parse_primary(), 0);
	}

	/**
	 *
	 * @param {Expression} left
	 * @param {number} precedence
	 * @returns {Expression}
	 */
	parse_expression_w_precedence(left, precedence) {
		// under the assumption this.next_token is an operator
		while (this.next_token && (TokenPrecedence.get(this.next_token) >= precedence)) {
			this.move_pointer(); // move to operator

			let operator = this.token; // get the operator

			this.move_pointer(); // move to next operand

			/** @type {Expression} */
			let right = this.parse_primary();

			// under the assumption this.next_token is an operator
			while (this.next_token && (TokenPrecedence.get(this.next_token) > TokenPrecedence.get(operator))) {
				right = this.parse_expression_w_precedence(right, TokenPrecedence.get(this.next_token));
			}

			left = new InfixExpression(operator, left, right);
		}

		return left;
	}

	/** @returns {NumberExpression} */
	parse_primary() {
		return new NumberExpression(this.token)
	}

	move_pointer() {
		this.token = this.next_token;

		// @ts-ignore
		this.next_token = this.lexer.next_token();
	}
}

const input = '1 * 2 + 3';
const lexer = new Lexer(input);
const parser = new Parser(lexer);

const expression = parser.parse_expression();
console.log(expression);
console.log(expression.print());


// let token;
// do {
// 	token = lexer.next_token();
// 	console.log(token);
// } while (token)

