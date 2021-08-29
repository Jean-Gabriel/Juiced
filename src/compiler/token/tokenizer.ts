import { DiagnosticCategory } from "../../diagnostic/reporter";
import { isBoolean, parseBoolean } from "../utils/boolean";
import { isAlpha, isAlphaNumeric, isDigit } from "../utils/char";
import { keywords } from "./keywords";
import { TokenKind } from "./kinds";
import type { BooleanLiteralTokenKind, NonLiteralTokenKind, NumberLiteralTokenKind, StringLiteralTokenKind, Token } from "./token";
import type { DiagnosticReporterFactory } from "../../diagnostic/reporter";
import type { SourceReaderFactory } from "../source/reader";

interface Tokenizer {
    tokenize: (source: string) => Token[]
}

type TokenizerFactoryProps = {
    createSourceReader: SourceReaderFactory,
    createDiagnosticReporter: DiagnosticReporterFactory
}

type TokenizerFactory = (factoryProps: TokenizerFactoryProps) => Tokenizer

export const createTokenizer: TokenizerFactory = ({ createSourceReader, createDiagnosticReporter }): Tokenizer => {
    const IGNORED = ['', ' ', ' \r', '\t'];

    const tokenize = (source: string): Token[] => {
        const tokens: Token[] = [];
        const reader = createSourceReader({ source });
        const reporter = createDiagnosticReporter();

        const createToken = () => {
            const lexeme = reader.pinned();
            const line = reader.lineIndex();

            return {
                nonLiteral: (kind: NonLiteralTokenKind): Token => ({ kind, lexeme, line }),
                numberLiteral: (kind: NumberLiteralTokenKind, literal: number): Token => ({ kind, lexeme, literal, line }),
                stringLiteral: (kind: StringLiteralTokenKind, literal: string): Token => ({ kind, lexeme, literal, line }),
                booleanLiteral: (kind: BooleanLiteralTokenKind, literal: boolean): Token => ({ kind, lexeme, literal, line })
            };
        };

        const createNonLiteralToken = (kind: NonLiteralTokenKind) => createToken().nonLiteral(kind);

        const createNumericToken = () => {
            reader.advanceWhile((char) => isDigit(char));

            if (isDigit(reader.next()) && reader.match('.')) {
                reader.advanceWhile((char) => isDigit(char));

                return createToken().numberLiteral(TokenKind.FLOAT, parseFloat(reader.pinned()));
            }

            return createToken().numberLiteral(TokenKind.INT, parseInt(reader.pinned()));
        };

        const createAlphaNumericToken = () => {
            reader.advanceWhile((char) => isAlphaNumeric(char));

            const pinned = reader.pinned();
            if (isBoolean(pinned)) {
                return createToken().booleanLiteral(TokenKind.BOOLEAN, parseBoolean(pinned));
            }

            const found = keywords.get(pinned);
            if (found !== undefined) {
                return createToken().nonLiteral(found);
            }

            return createToken().stringLiteral(TokenKind.IDENTIFIER, pinned);
        };

        const error = (message: string) => {
            reporter.emit({ category: DiagnosticCategory.ERROR, message });
        };


        const next = (): Token | null => {
            reader.pin();
            const char = reader.read();

            switch (char) {
                case '(': {
                    return createNonLiteralToken(TokenKind.OPEN_PARENTHESIS);
                }
                case ')': {
                    return createNonLiteralToken(TokenKind.CLOSE_PARENTHESIS);
                }
                case '{': {
                    return createNonLiteralToken(TokenKind.OPEN_BRACKETS);
                }
                case '}': {
                    return createNonLiteralToken(TokenKind.CLOSE_BRACKETS);
                }
                case ':': {
                    return createNonLiteralToken(TokenKind.COLON);
                }
                case ',': {
                    return createNonLiteralToken(TokenKind.COMA);
                }
                case '/': {
                    return createNonLiteralToken(TokenKind.SLASH);
                }
                case '*': {
                    return createNonLiteralToken(TokenKind.STAR);
                }
                case '+': {
                    return createNonLiteralToken(TokenKind.PLUS);
                }
                case '-': {
                    if (reader.match('>')) { return createNonLiteralToken(TokenKind.ARROW); }
                    else { return createNonLiteralToken(TokenKind.MINUS); }
                } case '!': {
                    if (reader.match('=')) { return createNonLiteralToken(TokenKind.BANG_EQUAL); }
                    else { return createNonLiteralToken(TokenKind.BANG); }
                }
                case '=': {
                    if (reader.match('=')) { return createNonLiteralToken(TokenKind.EQUAL_EQUAL); }
                    else { return createNonLiteralToken(TokenKind.EQUAL); }
                }
                case '>': {
                    if (reader.match('=')) { return createNonLiteralToken(TokenKind.GREATER_EQUAL); }
                    else { return createNonLiteralToken(TokenKind.GREATER_THAN); }
                }
                case '<': {
                    if (reader.match('=')) { return createNonLiteralToken(TokenKind.LESS_EQUAL); }
                    else { return createNonLiteralToken(TokenKind.LESS_THAN); }
                }
                default: {
                    if (char === null || IGNORED.includes(char)) {
                        return null;
                    }

                    if (isDigit(char)) {
                        return createNumericToken();
                    }

                    if (isAlpha(char)) {
                        return createAlphaNumericToken();
                    }

                    error(`Invalid character ${char} at line ${reader.lineIndex()} at index ${reader.position()}`);
                    return null;
                }
            }
        };

        while (!reader.isAtEnd()) {
            const token = next();

            if (token) {
                tokens.push(token);
            }
        }

        if(reporter.errored()) {
            reporter.report();
            throw new Error('Tokenizing error.');
        }

        return tokens;
    };

    return { tokenize };
};