import type { DeclarationNode } from "./declarations/declaration";
import type { AstNode, AstNodeKind } from "./node";

export interface Export extends AstNode {
    kind: AstNodeKind.EXPORT

    declaration: DeclarationNode
    acceptExport<T>(visitor: ExportVisitor<T>): T
}

export interface ExportVisitor<T> {
    visitExport(node: Export): T
}