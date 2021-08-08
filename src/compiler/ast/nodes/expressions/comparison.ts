import type { ExpressionNode } from "./expression";
import type { ComparisonOperator } from "./operators";

export interface ComparisonExpression extends ExpressionNode {
    kind: AstNodeKind.COMPARISON

    right: ExpressionNode
    operator: ComparisonOperator
    left: ExpressionNode
}