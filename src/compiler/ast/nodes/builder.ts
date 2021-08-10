import type { Declaration, DeclarationVisitor } from "./declarations/declaration";
import type { FunctionDeclaration } from "./declarations/function";
import type { Identifier, TypedIdentifier } from "./identifier";
import type { Program, ProgramVisitor } from "./program";
import type { Statement } from "./statements/statement";

const program = (declarations: Declaration[]): Program => {
    return {
        kind: AstNodeKind.PROGRAM,
        declarations,
        acceptProgramVisitor<T>(visitor: ProgramVisitor<T>) {
            return visitor.visitProgram(this);
        }
    };
};

const functionDeclaration = (identifier: Identifier, args: TypedIdentifier[], type: Identifier, statements: Statement[]): FunctionDeclaration => {
    return {
        kind: AstNodeKind.FUNCTION_DECLARATION,
        identifier,
        body: statements,
        arguments: args,
        type,
        acceptDeclarationVisitor<T>(visitor: DeclarationVisitor<T>) {
            return visitor.visitFunctionDeclaration(this);
        }
    };
};

const identifier = (value: string): Identifier => {
    return { value };
};

const typedIdentifier = (value: string, type: string): TypedIdentifier => {
    return { value, type };
};

export default {
    program,
    identifier,
    typedIdentifier,
    functionDeclaration
};