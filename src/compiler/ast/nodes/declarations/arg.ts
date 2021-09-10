import type { Type } from "../../../typing/type";
import type { Identifier } from "../identifier";
import type { AstNodeKind } from "../node";
import type { DeclarationNode } from "./declaration";

export interface FunctionArgument extends DeclarationNode {
    kind: AstNodeKind.FUNCTION_ARGUMENT

    identifier: Identifier
    type: Type
}