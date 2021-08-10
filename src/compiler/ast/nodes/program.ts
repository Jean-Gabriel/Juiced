import type { Declaration } from "./declarations/declaration";

export interface Program extends AstNode {
    kind: AstNodeKind.PROGRAM
    declarations: Declaration[]
    acceptProgramVisitor<T>(visitor: ProgramVisitor<T>): T
}

export interface ProgramVisitor<T> {
    visitProgram(program: Program): T
}