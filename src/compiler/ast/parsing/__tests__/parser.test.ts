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
            AstBuilder.source({
                declarations: [
                AstBuilder.exportation({
                    declaration: AstBuilder.functionDeclaration({
                        identifier: AstBuilder.identifier({ value: 'add' }),
                        args: [ AstBuilder.typedIdentifier({ value: 'a', type: 'i32'}), AstBuilder.typedIdentifier({ value: 'b', type: 'i32'}) ],
                        type: AstBuilder.identifier({ value: 'i32' }),
                        statements: []
                    })
                })
            ]})
        );
    });

    it('should parse variable declaration in function', () => {
        expectParse(`
            export let areEqual = (a: i32, b: i32) -> i32 {
                let x = a == b
            }
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.functionDeclaration({
                            identifier: AstBuilder.identifier({ value: 'areEqual' }),
                            args: [ AstBuilder.typedIdentifier({ value: 'a', type: 'i32' }), AstBuilder.typedIdentifier({ value: 'b', type: 'i32' }) ],
                            type: AstBuilder.identifier({ value: 'i32' }),
                            statements: [
                                AstBuilder.variableDeclaration({
                                    identifier: AstBuilder.identifier({ value: 'x' }),
                                    expression: AstBuilder.binaryExpression({
                                        left: AstBuilder.accessor({ identifier: AstBuilder.identifier({ value: 'a' })}),
                                        operator: OperatorKind.EQUAL_EQUAL,
                                        right: AstBuilder.accessor({ identifier: AstBuilder.identifier({ value: 'b' })}),
                                    })
                                })
                            ]
                        })
                    })
            ]})
        );
    });

    it('should parse return expression in function', () => {
        expectParse(`
            export let math = () -> i32 {
                2 * -4
            }
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.functionDeclaration({
                            identifier: AstBuilder.identifier({ value: 'math' }),
                            args: [],
                            type: AstBuilder.identifier({ value: 'i32' }),
                            statements: [
                                AstBuilder.binaryExpression({
                                    left: AstBuilder.intLiteral({ int: 2 }),
                                    operator: OperatorKind.MULTIPLICATION,
                                    right: AstBuilder.unaryExpression({
                                        operator: OperatorKind.MINUS,
                                        expression: AstBuilder.intLiteral({ int: 4 })
                                    })
                                })
                            ]
                        })
                    })
            ]})
        );
    });

    it('should parse grouped expression', () => {
        expectParse(`
            (2 + 2) + 2 / 2
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.binaryExpression({
                        left: AstBuilder.grouping({
                            expression: AstBuilder.binaryExpression({
                                left: AstBuilder.intLiteral({ int: 2 }),
                                operator: OperatorKind.PLUS,
                                right: AstBuilder.intLiteral({ int: 2 })
                            })
                        }),
                        operator: OperatorKind.PLUS,
                        right: AstBuilder.binaryExpression({
                            left: AstBuilder.intLiteral({ int: 2 }),
                            operator: OperatorKind.DIVISION,
                            right: AstBuilder.intLiteral({ int: 2 })
                        })
                    })
                ]
            })
        );
    });


    it('should parse int literal value', () => {
        expectParse(`
            2
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.intLiteral({ int: 2 })
                ]
            })
        );
    });

    it('should parse float literal value', () => {
        expectParse(`
            2.0
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.floatLiteral({ float: 2 })
                ]
            })
        );
    });

    it('should parse boolean literal value', () => {
        expectParse(`
            !false == true
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.binaryExpression({
                        left: AstBuilder.unaryExpression({
                            operator: OperatorKind.NOT,
                            expression: AstBuilder.booleanLiteral({ bool: false })
                        }),
                        operator: OperatorKind.EQUAL_EQUAL,
                        right: AstBuilder.booleanLiteral({ bool: true })
                    })
                ]
            })
        );
    });


    it('should parse top level expression', () => {
        expectParse(`
            1 * 2
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.binaryExpression({
                        left: AstBuilder.intLiteral({ int: 1 }),
                        operator: OperatorKind.MULTIPLICATION,
                        right: AstBuilder.intLiteral({ int: 2 })
                    })
                ]
            })
        );
    });

    it('should recover when encountering error', () => {
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

    it('should recover from broken expressions', () => {
        expectParse(`
            (2 + 1 / 3
            export let a = (a: i32, b: i32) -> i32 {
                1 + + 2 3
                let x = 1
                x
            }
        `).errors(2);
        // Error: unexpected expression
        // Error: invalid binary
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

        const tokenizer = createTokenizer({
            createSourceReader,
            createDiagnosticReporter: createTestDiagnoticsReporter
        });

        const tokens = tokenizer.tokenize(withoutStartAndEndLineBreak);

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