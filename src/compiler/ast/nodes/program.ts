import type { Export } from "./export";
import type { Expression } from "./expressions/expression";
import type { AstNode, AstNodeKind } from "./node";

export type TopLevelDeclaration = Export | Expression

export interface Program extends AstNode {
    kind: AstNodeKind.PROGRAM
    declarations: TopLevelDeclaration[]
    acceptProgramVisitor<T>(visitor: ProgramVisitor<T>): T
}

export interface ProgramVisitor<T> {
    visitProgram(program: Program): T
}