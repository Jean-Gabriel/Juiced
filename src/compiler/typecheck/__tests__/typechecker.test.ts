import { createTestDiagnoticsReporter } from "../../../../test/diagnostic/reporter";
import { createAstOptimizer } from "../../ast/optimization/optimizer";
import { createParser } from "../../ast/parsing/parser";
import { createSourceReader } from "../../source/reader";
import { createTokenReader } from "../../token/reader";
import { createTokenizer } from "../../token/tokenizer";
import { createTypechecker } from "../typechecker";

describe('Typechecker', () => {

    it('test', () => {
        expectTypechecks(`
            export let x = 1 + 1
            export let z = 2
            export let fun = (a: i32) -> bool {
                x == z == true
            }
        `).check();
    });

    const expectTypechecks = (sequence: string) => {
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

        const typechecker = createTypechecker({
            source: optimized,
            createDiagnosticReporter: () => createTestDiagnoticsReporter()
        });

        return {
            check: typechecker.check
        };
    };
});