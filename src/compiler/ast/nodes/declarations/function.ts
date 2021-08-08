import type { Identifier, TypedIdentifier } from "../identifier";
import type { DeclarationNode } from "./declaration";

export interface FunctionDeclaration extends DeclarationNode {
    kind: AstNodeKind.FUNCTION_DECLARATION

    identifier: Identifier
    arguments: TypedIdentifier[]
    type: Identifier
    body: any[]
}