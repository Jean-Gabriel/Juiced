import type { Type } from "../../../typing/type";
import type { Expression } from "../expressions/expression";
import type { Identifier } from "../identifier";
import type { AstNodeKind } from "../node";
import type { StatementNode } from "../statements/statement";
import type { DeclarationNode } from "./declaration";

export interface VariableDeclaration extends DeclarationNode, StatementNode {
    kind: AstNodeKind.VARIABLE_DECLARATION

    identifier: Identifier
    type?: Type
    expression: Expression
}