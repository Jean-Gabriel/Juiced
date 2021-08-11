import { createTestDiagnoticsReporter } from "../../../../../test/diagnostic/reporter";
import { createSourceReader } from "../../../source/reader";
import { createTokenReader } from "../../../token/reader";
import { createTokenizer } from "../../../token/tokenizer";
import AstBuilder from "../../nodes/builder";
import { OperatorKind } from "../../nodes/expressions/operators";
import type { Program } from "../../nodes/program";
import { createParser } from "../parser";

describe('Parser', () => {
    it('should parse top level exported function declaration', () => {
        expectParse(`
            export let add = (a: i32, b: i32) -> i32 {}
        `).createsAst(
            AstBuilder.program([
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
            AstBuilder.program([
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
            AstBuilder.program([
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
            AstBuilder.program([
                AstBuilder.intLiteral(2)
            ])
        );
    });

    it('should parse float literal value', () => {
        expectParse(`
            2.0
        `).createsAst(
            AstBuilder.program([
                AstBuilder.floatLiteral(2)
            ])
        );
    });

    it('should parse boolean literal value', () => {
        expectParse(`
            !false == true
        `).createsAst(
            AstBuilder.program([
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
            AstBuilder.program([
                AstBuilder.binaryExpression(
                    AstBuilder.intLiteral(1),
                    OperatorKind.MULTIPLICATION,
                    AstBuilder.intLiteral(2)
                )
            ])
        );
    });

    it('should not parse not exported top level expression', () => {
        expectParse(`
            let a = () -> int32 {}
        `).errors();
    });

    it('should not parse top level variable declaration', () => {
        expectParse(`
            let a = 1
        `).errors();
    });

    const expectParse = (sequence: string) => {
        const withoutStartAndEndLineBreak = sequence.replace(/^\n|\n$/g, '');

        const sourceReader = () => createSourceReader({ content: withoutStartAndEndLineBreak });
        const diagnosticReporter = () => createTestDiagnoticsReporter();

        const tokenizer = createTokenizer(sourceReader, diagnosticReporter);
        const tokens = tokenizer.tokenize();

        const parser = createParser(
            () => createTokenReader({ tokens }),
            () => createTestDiagnoticsReporter()
        );


        return {
            createsAst: (expected: Program) => {
                const ast = parser.parse();
                expect(JSON.stringify(ast)).toStrictEqual(JSON.stringify(expected));
            },
            errors: () => {
                expect(() => parser.parse()).toThrowError();
            }
        };
    };
});