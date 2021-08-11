export enum AstNodeKind {
    PROGRAM,

    EXPORT,

    FUNCTION_DECLARATION,
    VARIABLE_DECLARATION,

    ACCESSOR,

    BINARY,
    UNARY,

    INT_LITERAL,
    FLOAT_LITERAL,
    BOOLEAN_LITERAL
}

export interface AstNode {
    kind: AstNodeKind
}