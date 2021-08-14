import { createTestDiagnoticsReporter } from "../../../../../test/diagnostic/reporter";
import { createSourceReader } from "../../../source/reader";
import { createTokenReader } from "../../../token/reader";
import { createTokenizer } from "../../../token/tokenizer";
import AstBuilder from "../../nodes/builder";
import { OperatorKind } from "../../nodes/expressions/operators";
import type { Source } from "../../nodes/source";
import { createParser } from "../../parsing/parser";
import { createAstOptimizer } from "../optimizer";

describe('AstOptimizer', () => {

    it('should remove top level expressions', () => {
        expectOptimizedAst(`
            2 + 2 - 1 / 5 * 6
        `).toEqual(
            AstBuilder.source([])
        );
    });

    it('should not remove top level exports', () => {
        expectOptimizedAst(`
            3 + 3
            export let fun = () -> i32 {}
            export let val = 1 + 1
        `).toEqual(
            AstBuilder.source([
                AstBuilder.exportation(
                    AstBuilder.functionDeclaration(
                        AstBuilder.identifier('fun'),
                        [],
                        AstBuilder.identifier('i32'),
                        []
                    )
                ),
                AstBuilder.exportation(
                    AstBuilder.variableDeclaration(
                        AstBuilder.identifier('val'),
                        AstBuilder.binaryExpression(
                            AstBuilder.intLiteral(1),
                            OperatorKind.PLUS,
                            AstBuilder.intLiteral(1)
                        )
                    )
                )
            ])
        );
    });

    it('should remove non-returning expressions in functions', () => {
        expectOptimizedAst(`
            export let fun = () -> i32 {
                2 + 2 - 1 - 1
                1 + 2
            }
        `).toEqual(
            AstBuilder.source([
                AstBuilder.exportation(
                    AstBuilder.functionDeclaration(
                        AstBuilder.identifier('fun'),
                        [],
                        AstBuilder.identifier('i32'),
                        [
                            AstBuilder.binaryExpression(
                                AstBuilder.intLiteral(1),
                                OperatorKind.PLUS,
                                AstBuilder.intLiteral(2)
                            )
                        ]
                    )
                )
            ])
        );
    });

    const expectOptimizedAst = (sequence: string) => {
        const withoutStartAndEndLineBreak = sequence.replace(/^\n|\n$/g, '');

        const tokenizer = createTokenizer(
            () => createSourceReader({ content: withoutStartAndEndLineBreak }),
            () => createTestDiagnoticsReporter()
        );

        const tokens = tokenizer.tokenize();

        const parser = createParser(
            () => createTokenReader({ tokens }),
            () => createTestDiagnoticsReporter()
        );

        const source= parser.parse();
        const optimizer = createAstOptimizer({ source });

        const optimized = optimizer.optimize();

        return {
            toEqual: (expected: Source) => {
                expect(JSON.stringify(optimized)).toStrictEqual(JSON.stringify(expected));
            },
        };
    };

});