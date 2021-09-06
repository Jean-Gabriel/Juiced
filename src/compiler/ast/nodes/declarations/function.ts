import type { Type } from "../../../juice/type";
import type { Identifier, TypedIdentifier } from "../identifier";
import type { AstNodeKind } from "../node";
import type { Statement } from "../statements/statement";
import type { DeclarationNode } from "./declaration";

export interface FunctionDeclaration extends DeclarationNode {
    kind: AstNodeKind.FUNCTION_DECLARATION

    identifier: Identifier
    arguments: TypedIdentifier[]
    type: Type
    body: Statement[]
}