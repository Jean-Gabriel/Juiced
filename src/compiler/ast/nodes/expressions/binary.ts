import type { StatementNode } from "../statements/statement";
import type { Expression, ExpressionNode } from "./expression";
import type { BinaryOperator } from "./operators";

export interface BinaryExpression extends ExpressionNode, StatementNode {
    kind: AstNodeKind.BINARY

    right: Expression
    operator: BinaryOperator
    left: Expression
}