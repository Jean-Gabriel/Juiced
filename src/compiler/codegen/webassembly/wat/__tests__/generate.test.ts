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
    it('it should generate wat code for program', () => {
        const program = `export pi = const 3.1416;
        identity = const (1.0 + 1.0) / 2.0;
        two = const 2.0;

        identity_function = fun (): f32 {
            1.0;
        }
        
        export circumference_of_circle = fun (radius: f32): f32 {
            even_more_identity = const 1.0;
            (radius / (two * pi)) * identity * even_more_identity * identity_function(); 
        }`;

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

        console.dir(generateWAT(ast), { depth: null });
    });
});