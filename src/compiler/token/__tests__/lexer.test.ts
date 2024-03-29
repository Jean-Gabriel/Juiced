import { TokenFixture } from "../../../../test/compiler/token/token";
import { createTestDiagnoticsReporter } from "../../../../test/diagnostic/reporter";
import { createSourceReader } from "../../source/reader";
import { TokenKind } from "../kinds";
import type { Token } from "../token";
import { createLexer } from "../lexer";

describe('Lexer', () => {
    it.each([
        ['=', TokenFixture.create(_ => _.atLine(1).withLexeme('=').nonLiteral(TokenKind.EQUAL))],
        ['==', TokenFixture.create(_ => _.atLine(1).withLexeme('==').nonLiteral(TokenKind.EQUAL_EQUAL))],
        ['!', TokenFixture.create(_ => _.atLine(1).withLexeme('!').nonLiteral(TokenKind.BANG))],
        ['!=', TokenFixture.create(_ => _.atLine(1).withLexeme('!=').nonLiteral(TokenKind.BANG_EQUAL))],
        ['+', TokenFixture.create(_ => _.atLine(1).withLexeme('+').nonLiteral(TokenKind.PLUS))],
        ['-', TokenFixture.create(_ => _.atLine(1).withLexeme('-').nonLiteral(TokenKind.MINUS))],
        ['*', TokenFixture.create(_ => _.atLine(1).withLexeme('*').nonLiteral(TokenKind.STAR))],
        ['/', TokenFixture.create(_ => _.atLine(1).withLexeme('/').nonLiteral(TokenKind.SLASH))],
        ['(', TokenFixture.create(_ => _.atLine(1).withLexeme('(').nonLiteral(TokenKind.OPEN_PARENTHESIS))],
        [')', TokenFixture.create(_ => _.atLine(1).withLexeme(')').nonLiteral(TokenKind.CLOSE_PARENTHESIS))],
        ['{', TokenFixture.create(_ => _.atLine(1).withLexeme('{').nonLiteral(TokenKind.OPEN_BRACKETS))],
        ['}', TokenFixture.create(_ => _.atLine(1).withLexeme('}').nonLiteral(TokenKind.CLOSE_BRACKETS))],
        ['>', TokenFixture.create(_ => _.atLine(1).withLexeme('>').nonLiteral(TokenKind.GREATER_THAN))],
        ['>=', TokenFixture.create(_ => _.atLine(1).withLexeme('>=').nonLiteral(TokenKind.GREATER_EQUAL))],
        ['<', TokenFixture.create(_ => _.atLine(1).withLexeme('<').nonLiteral(TokenKind.LESS_THAN))],
        ['<=', TokenFixture.create(_ => _.atLine(1).withLexeme('<=').nonLiteral(TokenKind.LESS_EQUAL))],
        [':', TokenFixture.create(_ => _.atLine(1).withLexeme(':').nonLiteral(TokenKind.COLON))],
        [',', TokenFixture.create(_ => _.atLine(1).withLexeme(',').nonLiteral(TokenKind.COMA))],
        ['const', TokenFixture.create(_ => _.atLine(1).withLexeme('const').nonLiteral(TokenKind.CONST))],
        ['fun', TokenFixture.create(_ => _.atLine(1).withLexeme('fun').nonLiteral(TokenKind.FUN))],
        ['export', TokenFixture.create(_ => _.atLine(1).withLexeme('export').nonLiteral(TokenKind.EXPORT))],
        ['int', TokenFixture.create(_ => _.atLine(1).withLexeme('int').nonLiteral(TokenKind.INT_TYPE))],
        ['float', TokenFixture.create(_ => _.atLine(1).withLexeme('float').nonLiteral(TokenKind.FLOAT_TYPE))],
        ['bool', TokenFixture.create(_ => _.atLine(1).withLexeme('bool').nonLiteral(TokenKind.BOOLEAN_TYPE))]
    ])('should create token for %s', (char: string, expected: Token) => {
        expectTokenize(char).createsTokens(expected);
    });

    it('should throw error at the end of tokenizing if it reported errors', () => {
        expectTokenize(`$main = $ fun`).reportsError(2);
    });

    it('should tokenize a function declaration', () => {
        expectTokenize(`
            square = fun (a: int): bool {
                a * a;
            }
        `).createsTokens(
            TokenFixture.create(_ => _.atLine(1).withLexeme('square').withLiteral('square').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('=').nonLiteral(TokenKind.EQUAL)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('fun').nonLiteral(TokenKind.FUN)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('(').nonLiteral(TokenKind.OPEN_PARENTHESIS)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('a').withLiteral('a').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(1).withLexeme(':').nonLiteral(TokenKind.COLON)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('int').nonLiteral(TokenKind.INT_TYPE)),
            TokenFixture.create(_ => _.atLine(1).withLexeme(')').nonLiteral(TokenKind.CLOSE_PARENTHESIS)),
            TokenFixture.create(_ => _.atLine(1).withLexeme(':').nonLiteral(TokenKind.COLON)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('bool').nonLiteral(TokenKind.BOOLEAN_TYPE)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('{').nonLiteral(TokenKind.OPEN_BRACKETS)),
            TokenFixture.create(_ => _.atLine(2).withLexeme('a').withLiteral('a').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(2).withLexeme('*').nonLiteral(TokenKind.STAR)),
            TokenFixture.create(_ => _.atLine(2).withLexeme('a').withLiteral('a').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(2).withLexeme(';').nonLiteral(TokenKind.SEMICOLON)),
            TokenFixture.create(_ => _.atLine(3).withLexeme('}').nonLiteral(TokenKind.CLOSE_BRACKETS)),
        );
    });

    it('should tokenize a varaible declaration', () => {
        expectTokenize(`
            export count = const 1;
        `).createsTokens(
            TokenFixture.create(_ => _.atLine(1).withLexeme('export').nonLiteral(TokenKind.EXPORT)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('count').withLiteral('count').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('=').nonLiteral(TokenKind.EQUAL)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('const').nonLiteral(TokenKind.CONST)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('1').withLiteral(1).number(TokenKind.INT)),
            TokenFixture.create(_ => _.atLine(1).withLexeme(';').nonLiteral(TokenKind.SEMICOLON))
        );
    });

    it.each([
        ['1', TokenFixture.create(_ => _.atLine(1).withLexeme('1').withLiteral(1).number(TokenKind.INT))],
        ['1.0', TokenFixture.create(_ => _.atLine(1).withLexeme('1.0').withLiteral(1).number(TokenKind.FLOAT))],
        ['true', TokenFixture.create(_ => _.atLine(1).withLexeme('true').withLiteral(true).boolean())],
        ['false', TokenFixture.create(_ => _.atLine(1).withLexeme('false').withLiteral(false).boolean())],
    ])('should tokenize primitive %s', (primitive: string, expected) => {
        expectTokenize(primitive).createsTokens(expected);
    });

    const expectTokenize = (sequence: string) => {
        const withoutStartAndEndLineBreak = sequence.replace(/^\n|\n$/g, '');

        const reporter = createTestDiagnoticsReporter();
        const lexer = createLexer({
            createSourceReader,
            createDiagnosticReporter: () => reporter
        });

        return {
            createsTokens: (...expected: Token[]) => {
                const tokens = lexer.tokenize(withoutStartAndEndLineBreak);
                expected.forEach(token => expect(tokens).toContainEqual(token));
            },
            reportsError: (numberOfErrors: number) => {
                expect(() => lexer.tokenize(withoutStartAndEndLineBreak)).toThrowError();
                expect(reporter.emit).toHaveBeenCalledTimes(numberOfErrors);
                expect(reporter.report).toHaveBeenCalledTimes(1);
            }
        };
    };
});