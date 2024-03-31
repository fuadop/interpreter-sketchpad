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

	/** @param {Parser} parser */
	constructor(parser) {
		super('NUMBER');

		this.token = parser.token;
	}

	print() {
		return this.token.literal;
	}
}

class PrefixExpression extends Expression {
	/** @type {Token} */
	token;
	/** @type {Expression} */
	right;

	/** 
	 *
	 * @param {Parser} parser 
	 */
	constructor(parser) {
		super('PREFIX');

		this.token = parser.token;
		this.right = parser.parse_expression();
	}

	print() {
		return `${this.token.literal} ${this.right.print()}`; 
	}
}

class InfixExpression extends Expression {
	/** @type {Token} */
	token;

	/** @type {Expression} */
	left;
	/** @type {Expression} */
	right;

	/** 
	 *
	 * @param {Parser} parser 
	 */
	constructor(parser) {
		super('INFIX');

		this.left = new NumberExpression(parser);

		parser.move_pointer();

		this.token = parser.token;
		this.right = parser.parse_expression();
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
		/** @type {Expression} */
		let expression;

		this.move_pointer();

		if (!this.token)
			return new NullExpression();

		if (this.token?.type === TokenType.NUMBER) {
			const possible_infix = this.next_token &&
				this.next_token.type !== TokenType.NUMBER;

			expression = possible_infix ?
				new InfixExpression(this) :
				new NumberExpression(this);
		} else {
			const is_operator = this.token?.type &&
				this.token.type !== TokenType.NUMBER;

			if (is_operator) {
				expression = new PrefixExpression(this);
			} else {
				throw new Error(
					`Unable to parse ${this.token?.type} ->
						${this.token?.literal}
					`
				);
			}
		}

		return expression;
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

