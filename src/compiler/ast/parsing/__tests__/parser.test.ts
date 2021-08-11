import { createChalkDirectDiagnosticReporter } from "../../../../diagnostic/chalk/reporter";
import { createSourceReader } from "../../../source/reader";
import { createTokenReader } from "../../../token/reader";
import { createTokenizer } from "../../../token/tokenizer";
import { createParser } from "../parser";

describe('Parser', () => {
    it('should parse', () => {
        const program = `export let add = (a: i32, b: i32) -> i32 {
            let result = a + b
            result
        }`;

        const tokenizer = createTokenizer(
            () => createSourceReader(program),
            () => createChalkDirectDiagnosticReporter()
        );

        const tokens = tokenizer.tokenize();

        const parser = createParser(
            () => createTokenReader(tokens),
            () => createChalkDirectDiagnosticReporter()
        );

        const ast = parser.parse();

        console.dir(ast, { depth: null });
    });
});