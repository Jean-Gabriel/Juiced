import type { Module } from "../ast/nodes/module";

export type CodeGeneratorOutputOptions = {
    path: string
    name: string
}

export interface CodeGenerator {
    generate(module: Module, output: CodeGeneratorOutputOptions): Promise<void>
}