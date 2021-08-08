import { TokenKind } from "./kinds";

type TokenFields = {
    lexeme: string
    line: number
}

export type StringLiteralTokenKind = TokenKind.IDENTIFIER
type StringLiteralToken = {
    kind: StringLiteralTokenKind
    literal: string
} & TokenFields

export type NumberLiteralTokenKind = TokenKind.INT | TokenKind.FLOAT
type NumberLiteralToken = {
    kind: NumberLiteralTokenKind
    literal: number
} & TokenFields

export type BooleanLiteralTokenKind = TokenKind.BOOLEAN
type BooleanLiteralToken = {
    kind: BooleanLiteralTokenKind
    literal: boolean
} & TokenFields

export type NonLiteralTokenKind = Omit<TokenKind, StringLiteralTokenKind | NumberLiteralTokenKind | BooleanLiteralTokenKind>
type NonLiteralToken = {
    kind: NonLiteralTokenKind
} & TokenFields

export type Token = 
    | StringLiteralToken
    | NumberLiteralToken
    | BooleanLiteralToken
    | NonLiteralToken