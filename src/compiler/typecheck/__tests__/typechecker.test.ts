import { createTestDiagnoticsReporter } from "../../../../test/diagnostic/reporter";
import { createAstOptimizer } from "../../ast/parsing/optimization/optimizer";
import { createParser } from "../../ast/parsing/parser";
import { createSourceReader } from "../../source/reader";
import { createTokenReader } from "../../token/reader";
import { createTokenizer } from "../../token/tokenizer";
import { createTypechecker } from "../typechecker";

describe('Typechecker', () => {
    it('functions returns expression type must match their specified type', () => {
        expectTypechecking(`
            returns_bool = fun () -> bool
                true;
        `).succeeds();

        expectTypechecking(`
            returns_bool = fun () -> bool
                1.0;
        `).errors();
    });

    it('variable declarations in functions can refer to a variable of a higher scope', () => {
        expectTypechecking(`
            in_a_higher_scope = const 1.0;
            returns_higher_scope_val = fun () -> f32
                in_a_higher_scope;
        `).succeeds();
    });

    it('variable declarations in a lower scope cannot be accessed in a higher scope', () => {
        expectTypechecking(`
            function = fun () -> f32
                let lower_scope_val = 1.0
                1.0;

            let error = const lower_scope_val; 
        `).errors();
    });

    it('variable declarations should not reference undeclared variable', () => {
        expectTypechecking(`
            errors = const does_not_exists + 1; 
        `).errors();

        expectTypechecking(`
            references_undeclared_variable = fun () -> f32
                let errors = does_not_exists
                1.0;
        `).errors();
    });

    it('expressions should use values or other expressions of same type', () => {
        expectTypechecking(`
            function = fun (float_val: f32) -> f32
                let other_float_val = 1.0

                float_val + other_float_val;
        `).succeeds();

        expectTypechecking(`
            function = fun (float_val: f32) -> f32
                let int_val = 1
                let bool_val = false

                float_val + bool_val + int_val;
        `).errors();
    });

    const expectTypechecking = (sequence: string) => {
        const withoutStartAndEndLineBreak = sequence.replace(/^\n|\n$/g, '');

        const tokenizer = createTokenizer({
            createSourceReader,
            createDiagnosticReporter: createTestDiagnoticsReporter
        });

        const tokens = tokenizer.tokenize(withoutStartAndEndLineBreak);

        const parser = createParser({
            createTokenReader,
            createDiagnosticReporter: createTestDiagnoticsReporter,
            createAstOptimizer
        });

        const ast = parser.parse(tokens);

        const reporter = createTestDiagnoticsReporter();
        const typechecker = createTypechecker({
            createDiagnosticReporter: createTestDiagnoticsReporter
        });

        return {
            succeeds: () => {
                typechecker.run(ast);
                expect(reporter.errored()).toBeFalsy();
            },
            errors: () => {
                expect(() => typechecker.run(ast)).toThrowError();
                expect(reporter.errored()).toBeTruthy();
            }
        };
    };
});