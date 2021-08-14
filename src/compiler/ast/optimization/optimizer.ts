import AstBuilder from "../nodes/builder";
import { AstNodeKind } from "../nodes/node";
import type { Source, TopLevelDeclaration } from "../nodes/source";
import type { Statement } from "../nodes/statements/statement";

interface AstOptimizer {
    optimize: () => Source
}

type Props = {
    source: Source
}

// This will remove nodes that are supported by the parser but can never be used such as:
//      source top-level expressions
//      function non-returning expressions
export const createAstOptimizer = ({ source }: Props): AstOptimizer => {

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


    const optimize = () => {
        const toOptimized = AstBuilder.source([...source.declarations]);

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

        return AstBuilder.source(possiblyUsed);
    };

    return {
        optimize
    };
};