import type { ExpressionNode } from "./expression";

export interface UnaryExpression extends ExpressionNode {
    kind: AstNodeKind.UNARY

    expression: ExpressionNode
    operator: UnaryExpression
} 