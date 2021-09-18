import type { Module } from "../../src/compiler/ast/nodes/module";
import { createAstOptimizer } from "../../src/compiler/ast/parsing/optimization/optimizer";
import { createParser } from "../../src/compiler/ast/parsing/parser";
import type { CodeGeneratorOutputOptions } from "../../src/compiler/codegen/codegenerator";
import { createWebAssemblyGenerator } from "../../src/compiler/codegen/webassembly/generator";
import { createSourceReader } from "../../src/compiler/source/reader";
import { createLexer } from "../../src/compiler/token/lexer";
import { createTokenReader } from "../../src/compiler/token/reader";
import type { Token } from "../../src/compiler/token/token";
import { createTypeContext } from "../../src/compiler/typing/context";
import { createTypeResolver } from "../../src/compiler/typing/resolver";
import { createChalkDiagnosticReporter } from "../../src/diagnostic/chalk/reporter";

const tokenize = (source: string) => {
    const withoutStartAndEndLineBreak = source.replace(/^\n|\n$/g, '');

    const lexer = createLexer({
        createDiagnosticReporter: createChalkDiagnosticReporter,
        createSourceReader
    });

    return lexer.tokenize(withoutStartAndEndLineBreak);
};

const parse = (tokens: Token[]) => {
    const parser = createParser({
        createTokenReader,
        createDiagnosticReporter: createChalkDiagnosticReporter,
        createAstOptimizer
    });

    return parser.parse(tokens);
};

const resolve = (module: Module) => {
    const resolver = createTypeResolver({
        createDiagnosticReporter: createChalkDiagnosticReporter,
        createTypeContext,
    });

    resolver.resolve(module);

    return module;
};

const codegenWebAssembly = async (module: Module, options: CodeGeneratorOutputOptions) => {
    const generator = createWebAssemblyGenerator();

    await generator.generate(module, options);
};

export const CompilationHelper = {
    tokenize,
    parse,
    resolve,
    codegenWebAssembly
};