import assert from "assert";
import { TokenKind } from "../../../src/compiler/token/kinds";
import type { NonLiteralTokenKind, NumberLiteralTokenKind, StringLiteralTokenKind, Token } from "../../../src/compiler/token/token";

export class TokenFixture {
    static create(consume: (fixture: TokenFixture) => Token): Token {
        return consume(new TokenFixture());
    }

    private constructor(
        private lexeme: string = "lexeme",
        private literal: string | number | boolean = "literal",
        private line: number = 0
    ) { }

    atLine(line: number): TokenFixture {
        this.line = line;

        return this;
    }

    withLexeme(lexeme: string): TokenFixture {
        this.lexeme = lexeme;

        return this;
    }

    withLiteral(literal: string | number | boolean): TokenFixture {
        this.literal = literal;

        return this;
    }

    nonLiteral(kind: NonLiteralTokenKind): Token {
        return { kind, lexeme: this.lexeme, line: this.line };
    }

    number(kind: NumberLiteralTokenKind): Token {
        assert(typeof this.literal === 'number', 'Number token literal needs to be a number.');
        return { kind, lexeme: this.lexeme, line: this.line, literal: this.literal };
    }

    string(kind: StringLiteralTokenKind): Token {
        assert(typeof this.literal === 'string', 'String token literal needs to be a string.');
        return { kind, lexeme: this.lexeme, line: this.line, literal: this.literal };
    }

    boolean(): Token {
        assert(typeof this.literal === 'boolean', 'Boolean token literal needs to be a boolean.');
        return { kind: TokenKind.BOOLEAN, lexeme: this.lexeme, line: this.line, literal: this.literal };
    }
}