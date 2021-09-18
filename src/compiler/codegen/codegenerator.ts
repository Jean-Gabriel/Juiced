import type { Module } from "../ast/nodes/module";

type OutputOptions = {
    path: string
    name: string
}

export interface CodeGenerator {
    generate(module: Module, output: OutputOptions): void
}