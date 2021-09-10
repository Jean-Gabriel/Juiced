export enum AstNodeKind {
    MODULE,

    EXPORT,

    FUNCTION_DECLARATION,
    FUNCTION_ARGUMENT,
    VARIABLE_DECLARATION,

    ACCESSOR,
    INVOCATION,

    GROUPING,
    BINARY,
    UNARY,

    INT_LITERAL,
    FLOAT_LITERAL,
    BOOLEAN_LITERAL
}

export interface AstNode {
    kind: AstNodeKind
}