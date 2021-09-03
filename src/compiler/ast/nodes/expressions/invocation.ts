import type { Identifier } from "../identifier";
import type { AstNodeKind } from "../node";
import type { StatementNode } from "../statements/statement";
import type { Expression, ExpressionNode } from "./expression";

export interface Invocation extends ExpressionNode, StatementNode {
    kind: AstNodeKind.INVOCATION

    invoked: Identifier
    parameters: Expression[]
}