import { TokenKind } from "./kinds";

type TokenInformation = {
    lexeme: string
    line: number
}

export type StringLiteralTokenKind = TokenKind.IDENTIFIER
export const stringLiteralToken = (token: Token): token is StringLiteralToken => [TokenKind.IDENTIFIER].includes(token.kind) ;
export type StringLiteralToken = {
    kind: StringLiteralTokenKind
    literal: string
} & TokenInformation

export type NumberLiteralTokenKind = TokenKind.INT | TokenKind.FLOAT
export const numberLiteralToken = (token: Token): token is NumberLiteralToken => [TokenKind.INT, TokenKind.FLOAT].includes(token.kind);
export type NumberLiteralToken = {
    kind: NumberLiteralTokenKind
    literal: number
} & TokenInformation

export type BooleanLiteralTokenKind = TokenKind.BOOLEAN
export const booleanLiteralToken = (token: Token): token is BooleanLiteralToken => [TokenKind.BOOLEAN].includes(token.kind);
export type BooleanLiteralToken = {
    kind: BooleanLiteralTokenKind
    literal: boolean
} & TokenInformation

export type NonLiteralTokenKind = Exclude<TokenKind, StringLiteralTokenKind & NumberLiteralTokenKind & BooleanLiteralTokenKind>
export type NonLiteralToken = {
    kind: NonLiteralTokenKind
} & TokenInformation

export type Token =
    | StringLiteralToken
    | NumberLiteralToken
    | BooleanLiteralToken
    | NonLiteralToken