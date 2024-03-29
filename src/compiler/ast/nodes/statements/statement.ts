import type { VariableDeclaration } from "../declarations/variable";
import type { Expression } from "../expressions/expression";
import type { AstNode } from "../node";

export interface StatementNode extends AstNode {
    acceptStatementVisitor<T>(visitor: StatementVisitor<T>): T
}

export interface StatementVisitor<T> {
    visitVariableDeclaration(declaration: VariableDeclaration): T
    visitExpression(expression: Expression): T
}

export type Statement =
    | VariableDeclaration
    | Expression