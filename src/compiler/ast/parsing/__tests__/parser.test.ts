import { Primitive, Type } from "../../../typing/type";
import { createTokenReader } from "../../../token/reader";
import AstBuilder from "../../nodes/builder";
import { OperatorKind } from "../../nodes/expressions/operators";
import type { Module } from "../../nodes/module";
import { createAstOptimizer } from "../optimization/optimizer";
import { createParser } from "../parser";
import { CompilationHelper } from "../../../../../test/compiler/helper";
import { createTestDiagnoticsReporter } from "../../../../../test/diagnostic/reporter";

describe('Parser', () => {
    it('should parse top level exported function declaration', () => {
        expectParse(`
            export add = fun (a: int, b: int): int {
                a + b;
            }
        `).createsAst(
            AstBuilder.module({
                declarations: [
                AstBuilder.exportation({
                    declaration: AstBuilder.functionDeclaration({
                        identifier: AstBuilder.identifier({ value: 'add' }),
                        args: [
                            AstBuilder.functionArgument({
                                identifier: AstBuilder.identifier({ value: 'a' }),
                                type: Type.from(Primitive.INT)
                            }),
                            AstBuilder.functionArgument({
                                identifier: AstBuilder.identifier({ value: 'b' }),
                                type: Type.from(Primitive.INT)
                            })
                        ],
                        type: Type.from(Primitive.INT),
                        body: [
                            AstBuilder.binaryExpression({
                                left: AstBuilder.accessor({ identifier: AstBuilder.identifier({ value: 'a' }) }),
                                operator: OperatorKind.PLUS,
                                right: AstBuilder.accessor({ identifier: AstBuilder.identifier({ value: 'b' }) })
                            })
                        ]
                    })
                })
            ]})
        );
    });

    it('should parse variable declaration in function', () => {
        expectParse(`
            areEqual = fun (a: int, b: int): int {
                x = const a == b;
            }
        `).createsAst(
            AstBuilder.module({
                declarations: [
                    AstBuilder.functionDeclaration({
                        identifier: AstBuilder.identifier({ value: 'areEqual' }),
                        args: [
                            AstBuilder.functionArgument({
                                identifier: AstBuilder.identifier({ value: 'a' }),
                                type: Type.from(Primitive.INT)
                            }),
                            AstBuilder.functionArgument({
                                identifier: AstBuilder.identifier({ value: 'b' }),
                                type: Type.from(Primitive.INT)
                            })
                        ],
                        type: Type.from(Primitive.INT),
                        body: [
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
                ]
            })
        );
    });

    it('should parse return expression in function', () => {
        expectParse(`
            export math = fun (): int {
                2 * -4;
            }
        `).createsAst(
            AstBuilder.module({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.functionDeclaration({
                            identifier: AstBuilder.identifier({ value: 'math' }),
                            args: [],
                            type: Type.from(Primitive.INT),
                            body: [
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
            AstBuilder.module({
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
            AstBuilder.module({
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
            AstBuilder.module({
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
            AstBuilder.module({
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

    it('should parse invocation without parameters', () => {
        expectParse(`
            result = const invoked();
        `).createsAst(
            AstBuilder.module({
                declarations: [
                    AstBuilder.variableDeclaration({
                        identifier: AstBuilder.identifier({ value: 'result' }),
                        expression: AstBuilder.invocation({
                            invoked: AstBuilder.identifier({ value: 'invoked' }),
                            parameters: []
                        })
                    })
                ]
            })
        );
    });

    it('should parse invocation with parameters', () => {
        expectParse(`
            result = const invoked(-2 + 2, pi, other_invocation());
        `).createsAst(
            AstBuilder.module({
                declarations: [
                    AstBuilder.variableDeclaration({
                        identifier: AstBuilder.identifier({ value: 'result' }),
                        expression: AstBuilder.invocation({
                            invoked: AstBuilder.identifier({ value: 'invoked' }),
                            parameters: [
                                AstBuilder.binaryExpression({
                                    left: AstBuilder.unaryExpression({
                                        operator: OperatorKind.MINUS,
                                        expression: AstBuilder.intLiteral({ int: 2 })
                                    }),
                                    operator: OperatorKind.PLUS,
                                    right: AstBuilder.intLiteral({ int: 2 })
                                }),
                                AstBuilder.accessor({
                                    identifier: AstBuilder.identifier({ value: 'pi' })
                                }),
                                AstBuilder.invocation({
                                    invoked: AstBuilder.identifier({ value: 'other_invocation'}),
                                    parameters: []
                                })
                            ]
                        })
                    })
                ]
            })
        );
    });

    it('should ignore not returning expressions in functions', () => {
        expectParse(`
            export return_one = fun (): int {
                1 + 1;
                1;
            }
        `).createsAst(
            AstBuilder.module({
                declarations: [
                    AstBuilder.exportation({
                        declaration: AstBuilder.functionDeclaration({
                            identifier: AstBuilder.identifier({ value: 'return_one' }),
                            args: [],
                            type: Type.from(Primitive.INT),
                            body: [
                                AstBuilder.intLiteral({ int: 1 })
                            ]
                        })
                    })
                ]
            })
        );
    });

    it('should be able to parse a weirdly formated program', () => {
        expectParse(`
            weird_expression
                = 
                    const 1 +
                        (1 + 2)
                            * 2
                            ;
        `).createsAst(
            AstBuilder.module({
                declarations: [
                    AstBuilder.variableDeclaration({
                        identifier: AstBuilder.identifier({ value: 'weird_expression' }),
                        expression: AstBuilder.binaryExpression({
                            left: AstBuilder.intLiteral({ int: 1 }),
                            operator: OperatorKind.PLUS,
                            right: AstBuilder.binaryExpression({
                                left: AstBuilder.grouping({
                                    expression: AstBuilder.binaryExpression({
                                        left: AstBuilder.intLiteral({ int: 1 }),
                                        operator: OperatorKind.PLUS,
                                        right: AstBuilder.intLiteral({ int: 2 })
                                    })
                                }),
                                operator: OperatorKind.MULTIPLICATION,
                                right: AstBuilder.intLiteral({ int: 2, })
                            })
                        })
                    })
                ]
            })
        );
    });

    it('should ignore top level expressions', () => {
        expectParse(`
            1 * 2;
        `).createsAst(
            AstBuilder.module({
                declarations: []
            })
        );
    });

    it('should recover from broken variable declaration to semicolon', () => {
        expectParse(`
            error = const 2 + + * 2;
            y = const 2 + 2;
        `).errors(1);
    });

    it('should recover from broken function declaration to semicolon', () => {
        expectParse(`
            export error = fun (): not_supported_return_type {}
            y = const 2 + 2;
        `).errors(1);
    });

    it('should recover from broken function body expression to semicolon', () => {
        expectParse(`
            export error = fun (): int {
                1 * * 1;
                1;
            }
            y = const 2 + 2;
        `).errors(1);
    });

    it('should recover from broken function body expression to close bracket if semicolon is missing', () => {
        expectParse(`
            export error = fun (): int {
                1 * * 1
                1;
            }
            y = const 2 + 2;
        `).errors(1);
    });

    it('should not be able to recover from broken function body if semicolon and close bracket are missing', () => {
        expectParse(`
            export error = fun (): int {
                1 * * 1
                1
            y = const 2 + 2;
        `).errors(2); // broken expression + no close brackets found for function
    });

    it('should recover to semi colon everytime it encounters an error', () => {
        expectParse(`
            error_1 = const 2 + + * 2;
            y = const 2 + 2;
            error_2 = fun 2 + 2;
        `).errors(2);
    });

    it('should not be able to recover when it cannot find a semi colon', () => {
        expectParse(`
            error = const 2 + + * 2
            y = const 2 + 2
        `).errors(1); // there is only one error because it could not recover
    });

    const expectParse = (module: string) => {
        const { tokenize } = CompilationHelper;

        const tokens = tokenize(module);

        const reporter = createTestDiagnoticsReporter();
        const parser = createParser({
            createTokenReader,
            createDiagnosticReporter: () => reporter,
            createAstOptimizer
        });

        return {
            createsAst: (expected: Module) => {
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