import { TokenKind } from "../../../token/kinds";

export enum OperatorKind {
    PLUS,
    MULTIPLICATION,
    DIVISION,

    NOT_EQUAL,
    EQUAL,
    EQUAL_EQUAL,

    GREATER_THAN,
    GREATER_EQUAL,

    LESS_THAN,
    LESS_EQUAL,

    NOT,
    MINUS
}

export const binaryOperators = new Map<TokenKind, BinaryOperator>([
    [TokenKind.BANG_EQUAL, OperatorKind.NOT_EQUAL],
    [TokenKind.EQUAL, OperatorKind.EQUAL],
    [TokenKind.EQUAL_EQUAL, OperatorKind.EQUAL_EQUAL],
    [TokenKind.GREATER_EQUAL, OperatorKind.GREATER_EQUAL],
    [TokenKind.GREATER_THAN, OperatorKind.GREATER_THAN],
    [TokenKind.LESS_EQUAL, OperatorKind.LESS_EQUAL],
    [TokenKind.LESS_THAN, OperatorKind.LESS_THAN],
    [TokenKind.PLUS, OperatorKind.PLUS],
    [TokenKind.SLASH, OperatorKind.DIVISION],
    [TokenKind.STAR, OperatorKind.MULTIPLICATION],
    [TokenKind.MINUS, OperatorKind.MINUS],
]);

export const unaryOperators = new Map<TokenKind, UnaryOperator>([
    [TokenKind.BANG, OperatorKind.NOT],
    [TokenKind.MINUS, OperatorKind.MINUS],
]);

export type UnaryOperator =
    | OperatorKind.NOT
    | OperatorKind.MINUS
    | OperatorKind.PLUS

export type BinaryOperator = Exclude<OperatorKind, OperatorKind.NOT>

export type Operator =
    | BinaryOperator
    | UnaryOperator

