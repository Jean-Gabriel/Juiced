import type Module from "module";

export interface CodeGenerator {
    generate(module: Module, outputPath: string): void
}