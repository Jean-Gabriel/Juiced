import { createTestDiagnoticsReporter } from "../../../../test/diagnostic/reporter";
import { createChalkDiagnosticReporter } from "../../../diagnostic/chalk/reporter";
import { createAstOptimizer } from "../../ast/optimization/optimizer";
import { createParser } from "../../ast/parsing/parser";
import { createSourceReader } from "../../source/reader";
import { createTokenReader } from "../../token/reader";
import { createTokenizer } from "../../token/tokenizer";
import { createTypechecker } from "../typechecker";

describe('Typechecker', () => {

    it('test', () => {
        expectTypechecking(`
            export let x = 1 + 1
            export let e = 2
            export let fun = (a: i32) -> bool {
                x == z == true
            }
        `).doesNotError();
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
            () => createTestDiagnoticsReporter()
        );

        const ast = parser.parse();

        const optimizer = createAstOptimizer({ source: ast });
        const optimized = optimizer.optimize();

        const reporter = createChalkDiagnosticReporter();
        const typechecker = createTypechecker({
            source: optimized,
            createDiagnosticReporter: () => reporter
        });

        typechecker.check();

        return {
            doesNotError: () => {
                expect(reporter.errored()).toBeFalsy();
            },
            errors: () => {
                expect(reporter.errored()).toBeTruthy();
            }
        };
    };
});