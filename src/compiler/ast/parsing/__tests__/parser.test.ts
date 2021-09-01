import { createTestDiagnoticsReporter } from "../../../../../test/diagnostic/reporter";
import { createChalkDiagnosticReporter } from "../../../../diagnostic/chalk/reporter";
import { createSourceReader } from "../../../source/reader";
import { createTokenReader } from "../../../token/reader";
import { createTokenizer } from "../../../token/tokenizer";
import AstBuilder from "../../nodes/builder";
import { OperatorKind } from "../../nodes/expressions/operators";
import type { Source } from "../../nodes/source";
import { createAstOptimizer } from "../optimization/optimizer";
import { createParser } from "../parser";

describe('Parser', () => {
    it('should parse top level exported function declaration', () => {
        expectParse(`
            export add = fun (a: i32, b: i32) -> i32
                0;
        `).createsAst(
            AstBuilder.source({
                declarations: [
                AstBuilder.exportation({
                    declaration: AstBuilder.functionDeclaration({
                        identifier: AstBuilder.identifier({ value: 'add' }),
                        args: [ AstBuilder.typedIdentifier({ value: 'a', type: 'i32'}), AstBuilder.typedIdentifier({ value: 'b', type: 'i32'}) ],
                        type: AstBuilder.identifier({ value: 'i32' }),
                        statements: [
                            AstBuilder.intLiteral({ int: 0 })
                        ]
                    })
                })
            ]})
        );
    });

    it('should parse variable declaration in function', () => {
        expectParse(`
            export areEqual = fun (a: i32, b: i32) -> i32
                x = const a == b;
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
            export math = fun () -> i32
                2 * -4;
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
            export x = const (2 + 2) + 2 / 2;
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.variableDeclaration({
                            identifier: AstBuilder.identifier({ value: 'x' }),
                            expression: AstBuilder.binaryExpression({
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
                        })
                    })
                ]
            })
        );
    });


    it('should parse int literal value', () => {
        expectParse(`
            export x = const 2;
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.variableDeclaration({
                            identifier: AstBuilder.identifier({ value: 'x' }),
                            expression: AstBuilder.intLiteral({ int: 2 })
                        })
                    })
                ]
            })
        );
    });

    it('should parse float literal value', () => {
        expectParse(`
            export x = const 2.0;
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.variableDeclaration({
                            identifier: AstBuilder.identifier({ value: 'x' }),
                            expression: AstBuilder.floatLiteral({ float: 2 })
                        })
                    })
                ]
            })
        );
    });

    it('should parse boolean literal value', () => {
        expectParse(`
            export x = const !false == true;
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.variableDeclaration({
                            identifier: AstBuilder.identifier({ value: 'x' }),
                            expression: AstBuilder.binaryExpression({
                                left: AstBuilder.unaryExpression({
                                    operator: OperatorKind.NOT,
                                    expression: AstBuilder.booleanLiteral({ bool: false })
                                }),
                                operator: OperatorKind.EQUAL_EQUAL,
                                right: AstBuilder.booleanLiteral({ bool: true })
                            })
                        })
                    })
                ]
            })
        );
    });

    it('should ignore not returnin expressions in functions', () => {
        expectParse(`
            export return_one = fun () -> i32
                1 + 1
                1;
        `).createsAst(
            AstBuilder.source({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.functionDeclaration({
                            identifier: AstBuilder.identifier({ value: 'return_one' }),
                            args: [],
                            type: AstBuilder.identifier({ value: 'i32' }),
                            statements: [
                                AstBuilder.intLiteral({ int: 1 })
                            ]
                        })
                    })
                ]
            })
        );
    });

    it('should ignore top level expressions', () => {
        expectParse(`
            1 * 2
        `).createsAst(
            AstBuilder.source({
                declarations: []
            })
        );
    });

    const expectParse = (sequence: string) => {
        const withoutStartAndEndLineBreak = sequence.replace(/^\n|\n$/g, '');

        const tokenizer = createTokenizer({
            createSourceReader,
            createDiagnosticReporter: createTestDiagnoticsReporter
        });

        const tokens = tokenizer.tokenize(withoutStartAndEndLineBreak);

        const reporter = createChalkDiagnosticReporter();
        const parser = createParser({
            createTokenReader,
            createDiagnosticReporter: () => reporter,
            createAstOptimizer
        });

        return {
            createsAst: (expected: Source) => {
                const ast = parser.parse(tokens);

                expect(JSON.stringify(ast)).toStrictEqual(JSON.stringify(expected));
            },
            errors: (numberOfError: number) => {
                expect(() => parser.parse(tokens)).toThrowError();
                expect(reporter.emit).toHaveBeenCalledTimes(numberOfError);
                expect(reporter.report).toHaveBeenCalledTimes(1);
            }
        };
    };
});