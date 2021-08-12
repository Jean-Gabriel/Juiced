import { TokenFixture } from "../../../../test/compiler/token/token";
import { createTestDiagnoticsReporter } from "../../../../test/diagnostic/reporter";
import { createSourceReader } from "../../source/reader";
import { TokenKind } from "../kinds";
import type { Token } from "../token";
import { createTokenizer } from "../tokenizer";

describe('Tokenizer', () => {
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
        ['->', TokenFixture.create(_ => _.atLine(1).withLexeme('->').nonLiteral(TokenKind.ARROW))],
        ['let', TokenFixture.create(_ => _.atLine(1).withLexeme('let').nonLiteral(TokenKind.LET))],
        ['i32', TokenFixture.create(_ => _.atLine(1).withLexeme('i32').nonLiteral(TokenKind.INT_TYPE))],
        ['f32', TokenFixture.create(_ => _.atLine(1).withLexeme('f32').nonLiteral(TokenKind.FLOAT_TYPE))],
        ['bool', TokenFixture.create(_ => _.atLine(1).withLexeme('bool').nonLiteral(TokenKind.BOOLEAN_TYPE))],
        ['export', TokenFixture.create(_ => _.atLine(1).withLexeme('export').nonLiteral(TokenKind.EXPORT))]
    ])('it should create token for %s', (char: string, expected: Token) => {
        expectTokenize(char).createsTokens(expected);
    });

    it('should throw error at the end of tokenizing if it reported errors', () => {
        expectTokenize(`let $main $`).reportsError(2);
    });

    it('should tokenize a function declaration', () => {
        expectTokenize(`
            let square = (a: i32) -> bool {
                a * a
            } 
        `).createsTokens(
            TokenFixture.create(_ => _.atLine(1).withLexeme('let').nonLiteral(TokenKind.LET)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('square').withLiteral('square').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('=').nonLiteral(TokenKind.EQUAL)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('(').nonLiteral(TokenKind.OPEN_PARENTHESIS)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('a').withLiteral('a').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(1).withLexeme(':').nonLiteral(TokenKind.COLON)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('i32').nonLiteral(TokenKind.INT_TYPE)),
            TokenFixture.create(_ => _.atLine(1).withLexeme(')').nonLiteral(TokenKind.CLOSE_PARENTHESIS)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('->').nonLiteral(TokenKind.ARROW)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('bool').nonLiteral(TokenKind.BOOLEAN_TYPE)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('{').nonLiteral(TokenKind.OPEN_BRACKETS)),
            TokenFixture.create(_ => _.atLine(2).withLexeme('a').withLiteral('a').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(2).withLexeme('*').nonLiteral(TokenKind.STAR)),
            TokenFixture.create(_ => _.atLine(2).withLexeme('a').withLiteral('a').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(3).withLexeme('}').nonLiteral(TokenKind.CLOSE_BRACKETS)),
        );
    });

    it('should tokenize a varaible declaration', () => {
        expectTokenize(`
            let count = 1
        `).createsTokens(
            TokenFixture.create(_ => _.atLine(1).withLexeme('let').nonLiteral(TokenKind.LET)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('count').withLiteral('count').string(TokenKind.IDENTIFIER)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('=').nonLiteral(TokenKind.EQUAL)),
            TokenFixture.create(_ => _.atLine(1).withLexeme('1').withLiteral(1).number(TokenKind.INT))
        );
    });

    it.each([
        ['1', TokenFixture.create(_ => _.atLine(1).withLexeme('1').withLiteral(1).number(TokenKind.INT))],
        ['1.0', TokenFixture.create(_ => _.atLine(1).withLexeme('1.0').withLiteral(1).number(TokenKind.FLOAT))],
        ['true', TokenFixture.create(_ => _.atLine(1).withLexeme('true').withLiteral(true).boolean())],
        ['false', TokenFixture.create(_ => _.atLine(1).withLexeme('false').withLiteral(false).boolean())],
    ])('it should tokenize primitive %s', (primitive: string, expected) => {
        expectTokenize(primitive).createsTokens(expected);
    });

    const expectTokenize = (sequence: string) => {
        const withoutStartAndEndLineBreak = sequence.replace(/^\n|\n$/g, '');

        const sourceReader = () => createSourceReader({ content: withoutStartAndEndLineBreak });
        const diagnosticReporter = () => createTestDiagnoticsReporter();

        const tokenizer = createTokenizer(sourceReader, diagnosticReporter);

        return {
            createsTokens: (...expected: Token[]) => {
                const tokens = tokenizer.tokenize();
                expected.forEach(token => expect(tokens).toContainEqual(token));
            },
            reportsError: (numberOfErrors: number) => {
                expect(() => tokenizer.tokenize()).toThrowError();
                expect(diagnosticReporter().emit).toHaveBeenCalledTimes(numberOfErrors);
                expect(diagnosticReporter().report).toHaveBeenCalledTimes(1);
            }
        };
    };
});