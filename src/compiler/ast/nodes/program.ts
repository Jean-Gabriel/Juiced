import type { Declaration } from "./declarations/declaration";
import type { Expression } from "./expressions/expression";

export type TopLevelDeclaration = Declaration | Expression

export interface Program extends AstNode {
    kind: AstNodeKind.PROGRAM
    declarations: TopLevelDeclaration[]
    acceptProgramVisitor<T>(visitor: ProgramVisitor<T>): T
}

export interface ProgramVisitor<T> {
    visitProgram(program: Program): T
}