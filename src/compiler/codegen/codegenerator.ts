import type { Module } from "../ast/nodes/module";

export interface CodeGenerator {
    generate(module: Module, outputPath: string): void
}