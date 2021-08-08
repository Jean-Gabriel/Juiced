import type { DeclarationNode } from "./declarations/declaration";

export interface Export extends AstNode {
    kind: AstNodeKind.EXPORT

    declaration: DeclarationNode
    acceptExport<T>(node: ExportVisitor<T>): T
}

interface ExportVisitor<T> {
    visitExport(node: Export): T
}