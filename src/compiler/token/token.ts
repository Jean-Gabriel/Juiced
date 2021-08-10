import type { TokenKind } from "./kinds";

type TokenInformation = {
    lexeme: string
    line: number
}

export type StringLiteralTokenKind = TokenKind.IDENTIFIER
type StringLiteralToken = {
    kind: StringLiteralTokenKind
    literal: string
} & TokenInformation

export type NumberLiteralTokenKind = TokenKind.INT | TokenKind.FLOAT
type NumberLiteralToken = {
    kind: NumberLiteralTokenKind
    literal: number
} & TokenInformation

export type BooleanLiteralTokenKind = TokenKind.BOOLEAN
type BooleanLiteralToken = {
    kind: BooleanLiteralTokenKind
    literal: boolean
} & TokenInformation

export type NonLiteralTokenKind = Exclude<TokenKind, StringLiteralTokenKind & NumberLiteralTokenKind & BooleanLiteralTokenKind>
type NonLiteralToken = {
    kind: NonLiteralTokenKind
} & TokenInformation

export type Token =
    | StringLiteralToken
    | NumberLiteralToken
    | BooleanLiteralToken
    | NonLiteralToken