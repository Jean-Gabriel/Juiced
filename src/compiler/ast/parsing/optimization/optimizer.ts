import AstBuilder from "../../nodes/builder";
import { AstNodeKind } from "../../nodes/node";
import type { Module, TopLevelDeclaration } from "../../nodes/module";
import type { Statement } from "../../nodes/statements/statement";

interface AstOptimizer {
    optimize: (module: Module) => Module
}

export type AstOptimizerFactory = () => AstOptimizer

// This will remove nodes that are supported by the parser but can never be used such as:
//      module top-level expressions
//      function non-returning expressions
export const createAstOptimizer: AstOptimizerFactory = () => {

    const EXPRESSIONS = [
        AstNodeKind.BINARY,
        AstNodeKind.BOOLEAN_LITERAL,
        AstNodeKind.ACCESSOR,
        AstNodeKind.FLOAT_LITERAL,
        AstNodeKind.INT_LITERAL,
        AstNodeKind.UNARY
    ];

    const possiblyUsedTopLevelDeclarations = (declarations: TopLevelDeclaration[]): TopLevelDeclaration[] => {
        const possiblyUsed: TopLevelDeclaration[] = [];

        declarations.forEach(declaration => {
            if(EXPRESSIONS.includes(declaration.kind)) {
                return;
            }

            possiblyUsed.push(declaration);
        });

        return possiblyUsed;
    };

    const possiblyUsedStatements = (statements: Statement[]): Statement[] => {
        const possiblyUsed: Statement[] = [];

        statements.forEach((statement: Statement, index: number) => {
            if(EXPRESSIONS.includes(statement.kind)) {
                if(statements.length - 1 === index) {
                    return possiblyUsed.push(statement);
                }

                return;
            }

            return possiblyUsed.push(statement);
        });

        return possiblyUsed;
    };


    const optimize = (module: Module) => {
        const toOptimized = AstBuilder.module({ declarations: [...module.declarations] });

        const possiblyUsed = possiblyUsedTopLevelDeclarations(toOptimized.declarations);

        for(const topLeveldeclaration of possiblyUsed) {
            if(topLeveldeclaration.kind !== AstNodeKind.EXPORT) {
                continue;
            }

            const declaration = topLeveldeclaration.declaration;
            if(declaration.kind !== AstNodeKind.FUNCTION_DECLARATION) {
                continue;
            }

            declaration.body = [...possiblyUsedStatements(declaration.body)];
        }

        return AstBuilder.module({ declarations: possiblyUsed });
    };

    return {
        optimize
    };
};