import type { Type } from "../../../typing/type";
import type { Identifier } from "../identifier";
import type { AstNodeKind } from "../node";
import type { DeclarationNode } from "./declaration";

export interface Parameter extends DeclarationNode {
    kind: AstNodeKind.PARAMETER

    identifier: Identifier
    type: Type
}