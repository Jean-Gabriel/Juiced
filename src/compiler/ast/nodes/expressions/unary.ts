import type { StatementNode } from "../statements/statement";
import type { Expression, ExpressionNode } from "./expression";
import type { UnaryOperator } from "./operators";

export interface UnaryExpression extends ExpressionNode, StatementNode {
    kind: AstNodeKind.UNARY

    operator: UnaryOperator
    expression: Expression
}