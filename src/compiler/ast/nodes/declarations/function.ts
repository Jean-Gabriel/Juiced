import type { Type } from "../../../typing/type";
import type { Identifier } from "../identifier";
import type { AstNodeKind } from "../node";
import type { Statement } from "../statements/statement";
import type { FunctionArgument } from "./arg";
import type { DeclarationNode } from "./declaration";

export interface FunctionDeclaration extends DeclarationNode {
    kind: AstNodeKind.FUNCTION_DECLARATION

    identifier: Identifier
    arguments: FunctionArgument[]
    type: Type
    body: Statement[]
}