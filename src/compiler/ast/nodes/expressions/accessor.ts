import type { Identifier } from "../identifier";
import type { AstNodeKind } from "../node";
import type { StatementNode } from "../statements/statement";
import type { ExpressionNode } from "./expression";

export interface Accessor extends ExpressionNode, StatementNode {
    kind: AstNodeKind.ACCESSOR

    identifier: Identifier
}