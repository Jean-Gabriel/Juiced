import type { Declaration } from "./declarations/declaration";
import type { AstNode, AstNodeKind } from "./node";

export interface Export extends AstNode {
    kind: AstNodeKind.EXPORT

    declaration: Declaration
    acceptExport<T>(visitor: ExportVisitor<T>): T
}

export interface ExportVisitor<T> {
    visitExport(node: Export): T
}