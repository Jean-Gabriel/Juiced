import { SourceReader } from "../source/reader";
import { isBoolean, parseBoolean } from "../utils/boolean";
import { isAlpha, isAlphaNumeric, isDigit } from "../utils/char";
import { keywords } from "./keywords";
import { TokenKind } from "./kinds";
import { BooleanLiteralTokenKind, NonLiteralTokenKind, NumberLiteralTokenKind, StringLiteralTokenKind, Token } from "./token";

interface Tokenizer {
    tokenize: () => Token[]
}

export const createTokenizer = (createSourceReader: () => SourceReader): Tokenizer => {
    const IGNORED = ['', ' ', ' \r', '\t']
    
    const tokenize = (): Token[] => {
        const tokens: Token[] = []
        const reader = createSourceReader()

         const createToken = () => {
            const lexeme = reader.pinned()
            const line = reader.lineIndex()

            return {
                nonLiteral: (kind: NonLiteralTokenKind): Token => ({ kind, lexeme, line }),
                numberLiteral: (kind: NumberLiteralTokenKind, literal: number): Token => ({ kind, lexeme, literal, line }),
                stringLiteral: (kind: StringLiteralTokenKind, literal: string): Token => ({ kind, lexeme, literal, line }),
                booleanLiteral: (kind: BooleanLiteralTokenKind, literal: boolean): Token => ({ kind, lexeme, literal, line })
            }
        }

        const createNonLiteralToken = (kind: NonLiteralTokenKind) => createToken().nonLiteral(kind)
        
        const createNumericToken = () => {
            reader.advanceWhile((char) => isDigit(char))

            if(isDigit(reader.next()) && reader.match('.')) {
                reader.advanceWhile((char) => isDigit(char))

                return createToken().numberLiteral(TokenKind.FLOAT, parseFloat(reader.pinned()))
            }

            return createToken().numberLiteral(TokenKind.INT, parseInt(reader.pinned()))
        }
        
        const createAlphaNumericToken = () => {
            reader.advanceWhile((char) => isAlphaNumeric(char))

            const pinned = reader.pinned()
            if(isBoolean(pinned)) {
                return createToken().booleanLiteral(TokenKind.BOOLEAN, parseBoolean(pinned))
            }

            const found = keywords.get(pinned)
            if(found !== undefined) {
                return createToken().nonLiteral(found)
            }
            
            return createToken().stringLiteral(TokenKind.IDENTIFIER, pinned)
        }

        const next = (): Token | null => {
            reader.pin()
            const char = reader.read()
            
            switch(char) {
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
                    if(reader.match('>')) { return createNonLiteralToken(TokenKind.ARROW) }
                    else { return createNonLiteralToken(TokenKind.MINUS); }
                } case '!': {
                    if(reader.match('=')) { return createNonLiteralToken(TokenKind.BANG_EQUAL) }
                    else { return createNonLiteralToken(TokenKind.BANG) }
                }
                case '=': {
                    if(reader.match('=')) { return createNonLiteralToken(TokenKind.EQUAL_EQUAL) }
                    else { return createNonLiteralToken(TokenKind.EQUAL) }
                }
                case '>': {
                    if(reader.match('=')) { return createNonLiteralToken(TokenKind.GREATHER_EQUAL) }
                    else { return createNonLiteralToken(TokenKind.GREATHER_THAN) }
                }
                case '<': {
                    if(reader.match('=')) { return createNonLiteralToken(TokenKind.LESS_EQUAL) }
                    else { return createNonLiteralToken(TokenKind.LESS_THAN) }
                }
                default: {
                    if(char === null || IGNORED.includes(char)) {
                        return null
                    }

                    if(isDigit(char)) {
                        return createNumericToken()    
                    }

                    if(isAlpha(char)) {
                        return createAlphaNumericToken()
                    }

                    return null
                }
            }
        } 

        while(!reader.isAtEnd()) {
            const token = next()

            if(token) {
                tokens.push(token)
            }
        }  

        return tokens;
    }

    return { tokenize }
}