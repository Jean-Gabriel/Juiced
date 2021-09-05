import type { Declaration } from "../../ast/nodes/declarations/declaration";
import type { FunctionDeclaration } from "../../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../../ast/nodes/declarations/variable";
import { AstNodeKind } from "../../ast/nodes/node";
import type { Source } from "../../ast/nodes/source";

export type ModuleDeclarations = {
    functions: FunctionDeclaration[],
    variables: VariableDeclaration[]
}

export const moduleDeclarationsOf = (source: Source): ModuleDeclarations => {
    return source.declarations.reduce((acc, decl) => {
        const declaration = (declaration: Declaration) => {
            if(declaration.kind === AstNodeKind.FUNCTION_DECLARATION) {
                acc.functions = [...acc.functions, declaration];
            }

            if(declaration.kind === AstNodeKind.VARIABLE_DECLARATION) {
                acc.variables = [...acc.variables, declaration];
            }
        };

        if(decl.kind === AstNodeKind.EXPORT) {
            declaration(decl.declaration);
        }

        if(decl.kind === AstNodeKind.FUNCTION_DECLARATION || decl.kind === AstNodeKind.VARIABLE_DECLARATION) {
            declaration(decl);
        }

        return acc;
    }, { functions: new Array<FunctionDeclaration>(), variables: new Array<VariableDeclaration>()});
};