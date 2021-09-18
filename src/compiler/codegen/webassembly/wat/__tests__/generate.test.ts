import { createTestDiagnoticsReporter } from "../../../../../../test/diagnostic/reporter";
import { createChalkDiagnosticReporter } from "../../../../../diagnostic/chalk/reporter";
import { createAstOptimizer } from "../../../../ast/parsing/optimization/optimizer";
import { createParser } from "../../../../ast/parsing/parser";
import { createSourceReader } from "../../../../source/reader";
import { createLexer } from "../../../../token/lexer";
import { createTokenReader } from "../../../../token/reader";
import { createTypeContext } from "../../../../typing/context";
import { createTypeResolver } from "../../../../typing/resolver";
import { generateWAT } from "../generate";

describe('GenerateWAT', () => {
    test('generate wat cuz no cli :(', () => {
        const program = `
            export pi = const 3.1416;

            identity = const 1.0;
            export circumferenceOfCircle = fun (radius: f32): f32 {
                (radius * (2.0 * pi)) * identity;
            }
        `;

        const lexer = createLexer({
            createDiagnosticReporter: createTestDiagnoticsReporter,
            createSourceReader: createSourceReader
        });

        const tokens = lexer.tokenize(program);

        const parser = createParser({
            createTokenReader,
            createAstOptimizer,
            createDiagnosticReporter: createTestDiagnoticsReporter
        });

        const ast = parser.parse(tokens);

        const resolver = createTypeResolver({
            createDiagnosticReporter: createChalkDiagnosticReporter,
            createTypeContext
        });

        resolver.resolve(ast);

        const generated = generateWAT(ast);

        console.log(generated.read());
    });
});