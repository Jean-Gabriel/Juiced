export enum OperatorKind {
    ADDITION,
    SUBSTRACTION,
    MULTIPLICATION,
    DIVISION,

    NOT_EQUAL,
    EQUAL,

    GREATHER_THAN,
    GREATHER_EQUAL,

    LESS_THAN,
    LESS_EQUAL,

    NOT,
    MINUS
}

export type ComparisonOperator =
    | OperatorKind.EQUAL
    | OperatorKind.NOT_EQUAL
    | OperatorKind.GREATHER_THAN
    | OperatorKind.GREATHER_EQUAL
    | OperatorKind.LESS_THAN
    | OperatorKind.LESS_EQUAL

export type BinaryOperator =
    | OperatorKind.ADDITION
    | OperatorKind.DIVISION
    | OperatorKind.MULTIPLICATION
    | OperatorKind.DIVISION

export type UnaryOperator =
    | OperatorKind.NOT
    | OperatorKind.MINUS

export type Operator =
    | ComparisonOperator
    | BinaryOperator
    | UnaryOperator

