import type { DeclarationNode } from "./declarations/declaration";

export interface Program extends AstNode {
    kind: AstNodeKind.PROGRAM
    declarations: DeclarationNode[]
    acceptModuleVisitor<T>(visitor: ProgramVisitor<T>): T
}

interface ProgramVisitor<T> {
    visitProgram(program: Program): T
}