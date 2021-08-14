import type { AstNodeKind } from "../node";
import type { StatementNode } from "../statements/statement";
import type { Expression, ExpressionNode } from "./expression";

export interface GroupingExpression extends ExpressionNode, StatementNode {
    kind: AstNodeKind.GROUPING

    expression: Expression
}