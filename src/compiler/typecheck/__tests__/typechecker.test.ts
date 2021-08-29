import { createTestDiagnoticsReporter } from "../../../../test/diagnostic/reporter";
import { createChalkDiagnosticReporter } from "../../../diagnostic/chalk/reporter";
import { createAstOptimizer } from "../../ast/optimization/optimizer";
import { createParser } from "../../ast/parsing/parser";
import { createSourceReader } from "../../source/reader";
import { createTokenReader } from "../../token/reader";
import { createTokenizer } from "../../token/tokenizer";
import { createTypechecker } from "../typechecker";

describe('Typechecker', () => {
    it('functions returns expression type must match their specified type', () => {
        expectTypechecking(`
            export let returns_bool = () -> bool {
                true
            }
        `).succeeds();

        expectTypechecking(`
            export let returns_bool = () -> bool {
                1.0
            }
        `).errors();
    });

    it('variable declarations in functions can refer to a variable of a higher scope', () => {
        expectTypechecking(`
            export let in_a_higher_scope = 1.0
            export let returns_higher_scope_val = () -> f32 {
                in_a_higher_scope
            } 
        `).succeeds();
    });

    it('variable declarations in a lower scope cannot be accessed in a higher scope', () => {
        expectTypechecking(`
            export let fun = () -> f32 {
                let lower_scope_val = 1.0
                1.0
            }

            export let error = lower_scope_val 
        `).errors();
    });

    it('variable declarations should not reference undeclared variable', () => {
        expectTypechecking(`
            export let errors = does_not_exists + 1 
        `).errors();

        expectTypechecking(`
            export let references_undeclared_variable = () -> f32 {
                let errors = does_not_exists
                1.0
            }
        `).errors();
    });

    it('expressions should use values or other expressions of same type', () => {
        expectTypechecking(`
            export let fun = (float_val: f32) -> f32 {
                let other_float_val = 1.0

                float_val + other_float_val
            }
        `).succeeds();

        expectTypechecking(`
            export let fun = (float_val: f32) -> f32 {
                let int_val = 1
                let bool_val = false

                float_val + bool_val + int_val
            }
        `).errors();
    });

    const expectTypechecking = (sequence: string) => {
        const withoutStartAndEndLineBreak = sequence.replace(/^\n|\n$/g, '');

        const tokenizer = createTokenizer(
            () => createSourceReader({ content: withoutStartAndEndLineBreak }),
            () => createTestDiagnoticsReporter()
        );

        const tokens = tokenizer.tokenize();

        const parser = createParser(
            () => createTokenReader({ tokens }),
            () => createChalkDiagnosticReporter()
        );

        const ast = parser.parse();

        const optimizer = createAstOptimizer({ source: ast });
        const optimized = optimizer.optimize();

        const reporter = createTestDiagnoticsReporter();
        const typechecker = createTypechecker({
            source: optimized,
            createDiagnosticReporter: () => reporter
        });

        return {
            succeeds: () => {
                typechecker.check();
                expect(reporter.errored()).toBeFalsy();
            },
            errors: () => {
                expect(() => typechecker.check()).toThrowError();
                expect(reporter.errored()).toBeTruthy();
            }
        };
    };
});