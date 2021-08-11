import type { Expression } from "../expressions/expression";
import type { Identifier } from "../identifier";
import type { StatementNode } from "../statements/statement";
import type { DeclarationNode } from "./declaration";

export interface VariableDeclaration extends DeclarationNode, StatementNode {
    kind: AstNodeKind.VARIABLE_DECLARATION

    identifier: Identifier
    expression: Expression
}