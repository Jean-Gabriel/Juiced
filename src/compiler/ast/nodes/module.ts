import type { Declaration } from "./declarations/declaration";
import type { Export } from "./export";
import type { Expression } from "./expressions/expression";
import type { AstNodeKind } from "./node";
import type { AstNode } from "./node";

export type TopLevelDeclaration = Export | Declaration | Expression

export interface Module extends AstNode {
    kind: AstNodeKind.MODULE
    declarations: TopLevelDeclaration[]
    acceptModuleVisitor<T>(visitor: ModuleVisitor<T>): T
}

export interface ModuleVisitor<T> {
    visitModule(module: Module): T
}