import { createTestDiagnoticsReporter } from "../../../../../test/diagnostic/reporter";
import { createSourceReader } from "../../../source/reader";
import { createTokenReader } from "../../../token/reader";
import { createTokenizer } from "../../../token/tokenizer";
import AstBuilder from "../../nodes/builder";
import { OperatorKind } from "../../nodes/expressions/operators";
import type { Source } from "../../nodes/source";
import { createParser } from "../parser";

describe('Parser', () => {
    it('should parse top level exported function declaration', () => {
        expectParse(`
            export let add = (a: i32, b: i32) -> i32 {}
        `).createsAst(
            AstBuilder.source([
                AstBuilder.exportation(
                    AstBuilder.functionDeclaration(
                        AstBuilder.identifier('add'),
                        [ AstBuilder.typedIdentifier('a', 'i32'), AstBuilder.typedIdentifier('b', 'i32') ],
                        AstBuilder.identifier('i32'),
                        []
                    )
                )
            ])
        );
    });

    it('should parse variable declaration in function', () => {
        expectParse(`
            export let areEqual = (a: i32, b: i32) -> i32 {
                let x = a == b
            }
        `).createsAst(
            AstBuilder.source([
                AstBuilder.exportation(
                    AstBuilder.functionDeclaration(
                        AstBuilder.identifier('areEqual'),
                        [ AstBuilder.typedIdentifier('a', 'i32'), AstBuilder.typedIdentifier('b', 'i32') ],
                        AstBuilder.identifier('i32'),
                        [
                            AstBuilder.variableDeclaration(
                                AstBuilder.identifier('x'),
                                AstBuilder.binaryExpression(
                                    AstBuilder.accessor(AstBuilder.identifier('a')),
                                    OperatorKind.EQUAL_EQUAL,
                                    AstBuilder.accessor(AstBuilder.identifier('b'))
                                )
                            )
                        ]
                    )
                )
            ])
        );
    });

    it('should parse return expression in function', () => {
        expectParse(`
            export let math = () -> i32 {
                2 * -4
            }
        `).createsAst(
            AstBuilder.source([
                AstBuilder.exportation(
                    AstBuilder.functionDeclaration(
                        AstBuilder.identifier('math'),
                        [ ],
                        AstBuilder.identifier('i32'),
                        [
                            AstBuilder.binaryExpression(
                                AstBuilder.intLiteral(2),
                                OperatorKind.MULTIPLICATION,
                                AstBuilder.unaryExpression(
                                    OperatorKind.MINUS,
                                    AstBuilder.intLiteral(4)
                                )
                            )
                        ]
                    )
                )
            ])
        );
    });

    it('should parse int literal value', () => {
        expectParse(`
            2
        `).createsAst(
            AstBuilder.source([
                AstBuilder.intLiteral(2)
            ])
        );
    });

    it('should parse float literal value', () => {
        expectParse(`
            2.0
        `).createsAst(
            AstBuilder.source([
                AstBuilder.floatLiteral(2)
            ])
        );
    });

    it('should parse boolean literal value', () => {
        expectParse(`
            !false == true
        `).createsAst(
            AstBuilder.source([
                AstBuilder.binaryExpression(
                    AstBuilder.unaryExpression(
                        OperatorKind.NOT,
                        AstBuilder.booleanLiteral(false)
                    ),
                    OperatorKind.EQUAL_EQUAL,
                    AstBuilder.booleanLiteral(true)
                )
            ])
        );
    });


    it('should parse top level expression', () => {
        expectParse(`
            1 * 2
        `).createsAst(
            AstBuilder.source([
                AstBuilder.binaryExpression(
                    AstBuilder.intLiteral(1),
                    OperatorKind.MULTIPLICATION,
                    AstBuilder.intLiteral(2)
                )
            ])
        );
    });

    it('it should recover when encountering error', () => {
        expectParse(`
            let a = 1 + 1
            export let a = (a: i32 b: i32) -> i32 {
                () -> 1
                let x = a + b
                x
            }
        `).errors(3);
        // Error: unexported top level declaration
        // Error: no coma between arguments
        // Error: invalid syntax in function body
    });

    it('it should recover from broken expression', () => {
        expectParse(`
            export let a = (a: i32, b: i32) -> i32 {
                1 + + 2 3
                let x = 1
                x
            }
        `).errors(1);
        // Error: unexpected expression
    });

    it('should not parse not exported top level expression', () => {
        expectParse(`
            let a = () -> i32 {}
            export let a = () -> i32 {}
        `).errors(1);
    });

    it('should not parse top level variable declaration', () => {
        expectParse(`
            let a = 1
        `).errors(1);
    });

    const expectParse = (sequence: string) => {
        const withoutStartAndEndLineBreak = sequence.replace(/^\n|\n$/g, '');

        const tokenizer = createTokenizer(
            () => createSourceReader({ content: withoutStartAndEndLineBreak }),
            () => createTestDiagnoticsReporter()
        );

        const tokens = tokenizer.tokenize();

        const reporter = createTestDiagnoticsReporter();
        const parser = createParser(
            () => createTokenReader({ tokens }),
            () => reporter
        );

        return {
            createsAst: (expected: Source) => {
                const ast = parser.parse();
                expect(JSON.stringify(ast)).toStrictEqual(JSON.stringify(expected));
            },
            errors: (numberOfError: number) => {
                expect(() => parser.parse()).toThrowError();
                expect(reporter.emit).toHaveBeenCalledTimes(numberOfError);
                expect(reporter.report).toHaveBeenCalledTimes(1);
            }
        };
    };
});