import type { AstNodeKind } from "../node";
import type { StatementNode } from "../statements/statement";
import type { ExpressionNode } from "./expression";

export interface IntLiteral extends ExpressionNode, StatementNode {
    kind: AstNodeKind.INT_LITERAL
    value: number
}

export interface FloatLiteral extends ExpressionNode, StatementNode {
    kind: AstNodeKind.FLOAT_LITERAL
    value: number
}

export interface BooleanLiteral extends ExpressionNode, StatementNode {
    kind: AstNodeKind.BOOLEAN_LITERAL
    value: boolean
}

export type Literal =
    | BooleanLiteral
    | FloatLiteral
    | IntLiteral