import yargs from 'yargs';
import { File } from '../common/file';
import { createAstOptimizer } from '../compiler/ast/parsing/optimization/optimizer';
import { createParser } from '../compiler/ast/parsing/parser';
import type { CodeGeneratorOutputOptions } from '../compiler/codegen/codegenerator';
import { createWebAssemblyGenerator } from '../compiler/codegen/webassembly/generator';
import { createSourceReader } from '../compiler/source/reader';
import { createLexer } from '../compiler/token/lexer';
import { createTokenReader } from '../compiler/token/reader';
import { createTypeContext } from '../compiler/typing/context';
import { createTypeResolver } from '../compiler/typing/resolver';
import { createChalkDiagnosticReporter } from '../diagnostic/chalk/reporter';

const options = yargs
    .usage("Usage: -c <module-to-compile> -p <output-path> -n <output-module-name>")
    .option('c', { alias: 'compile', describe: 'Module to compile', type: 'string', default: 'main.jas'})
    .option('p', { alias: 'path', describe: 'Output path', type: 'string', default: 'build' })
    .option('n', { alias: 'module-name', describe: 'Output module name', type: 'string', default: 'module' })
    .argv;

const lexer = createLexer({
    createSourceReader,
    createDiagnosticReporter: createChalkDiagnosticReporter
});

const parser = createParser({
    createTokenReader,
    createAstOptimizer,
    createDiagnosticReporter: createChalkDiagnosticReporter
});

const resolver = createTypeResolver({
    createTypeContext,
    createDiagnosticReporter: createChalkDiagnosticReporter
});

const codegenerator = createWebAssemblyGenerator();

(async () => {
    const juiceModulePath = `${process.cwd()}/${options.c}`;
    const juiceModule = File.read(juiceModulePath);

    const outputOptions: CodeGeneratorOutputOptions = {
        name: options.n,
        path: options.p
    };

    const tokens = lexer.tokenize(juiceModule.asString());
    const ast = parser.parse(tokens);
    resolver.resolve(ast);
    codegenerator.generate(ast, outputOptions);
})();

