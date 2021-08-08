import { Expression } from "../expressions/expression";
import type { Identifier } from "../identifier";
import type { DeclarationNode } from "./declaration";

export interface VariableDeclaration extends DeclarationNode {
    kind: AstNodeKind.VARIABLE_DECLARATION

    identifier: Identifier
    expression: Expression[]
} 