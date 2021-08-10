import type { FunctionDeclaration } from "./function";
import type { VariableDeclaration } from "./variable";

export interface DeclarationNode extends AstNode {
    acceptDeclarationVisitor<T>(visitor: DeclarationVisitor<T>): T
}

export interface DeclarationVisitor<T> {
    visitFunctionDeclaration(declaration: FunctionDeclaration): T
    visitVariableDeclaration(declaration: VariableDeclaration): T
}

export type Declaration =
    | FunctionDeclaration
    | VariableDeclaration