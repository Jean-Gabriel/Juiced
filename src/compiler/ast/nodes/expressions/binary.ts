import type { ExpressionNode } from "./expression";
import type { BinaryOperator } from "./operators";

export interface BinaryExpression extends ExpressionNode {
    kind: AstNodeKind.BINARY

    right: ExpressionNode
    operator: BinaryOperator
    left: ExpressionNode
} 