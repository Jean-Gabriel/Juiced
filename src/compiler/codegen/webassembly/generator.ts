import type { Module } from "../../ast/nodes/module";
import type { CodeGenerator } from "../codegenerator";

type WebAssemblyGenerator = CodeGenerator
type WebAssemblyGeneratorFactory = () => WebAssemblyGenerator

export const createWebAssemblyGenerator: WebAssemblyGeneratorFactory = () => {

    const generate = (module: Module, outputPath: string) => {
        return undefined;
    };

    return {
        generate
    };
};
