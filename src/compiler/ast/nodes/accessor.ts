import type { Identifier } from "./identifier";

export interface Accessor extends AstNode {
    kind: AstNodeKind.ACCESSOR
    
    identifier: Identifier
    acceptAccessor<T>(node: AccessorVisitor<T>): T
}

interface AccessorVisitor<T> {
    visitAccessor(accessor: Accessor): T
}