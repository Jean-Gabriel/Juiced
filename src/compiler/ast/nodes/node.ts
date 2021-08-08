enum AstNodeKind {
    PROGRAM,

    EXPORT,

    FUNCTION_DECLARATION,
    VARIABLE_DECLARATION,

    ACCESSOR,

    COMPARISON,
    BINARY,
    UNARY,

    LITERAL
}

interface AstNode {
    kind: AstNodeKind
}