export enum AstNodeKind {
    SOURCE,

    EXPORT,

    FUNCTION_DECLARATION,
    VARIABLE_DECLARATION,

    ACCESSOR,

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