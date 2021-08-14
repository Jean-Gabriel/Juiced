import type { Export } from "./export";
import type { Expression } from "./expressions/expression";
import type { AstNode, AstNodeKind } from "./node";

export type TopLevelDeclaration = Export | Expression

export interface Source extends AstNode {
    kind: AstNodeKind.SOURCE
    declarations: TopLevelDeclaration[]
    acceptSourceVisitor<T>(visitor: SourceVisitor<T>): T
}

export interface SourceVisitor<T> {
    visitSource(source: Source): T
}