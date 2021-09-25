import type { Module } from "../../ast/nodes/module";
import type { CodeGenerator } from "../codegenerator";
import { generateWebAssemblyModule } from "./module/generate";
import { generateWASMFromFile as generateWASMFromFile } from "./wasm/generate";
import { generateWAT } from "./wat/generate";

type WebAssemblyGenerator = CodeGenerator
type WebAssemblyGeneratorFactory = () => WebAssemblyGenerator

type OutputOptions = {
    path: string
    name: string
}

export const createWebAssemblyGenerator: WebAssemblyGeneratorFactory = () => {
    const generate = async (module: Module, { path, name = 'main' }: OutputOptions) => {
        const watName = `${name}.wat`;
        const wasmName = `${name}.wasm`;
        const tsModuleName = `${name}.ts`;

        const wat = generateWAT(module);
        const created = wat.save(path, watName);

        const wasm = await generateWASMFromFile(created);
        wasm.save(path, wasmName);

        const tsModule = generateWebAssemblyModule(module, name);
        tsModule.save(path, tsModuleName);
    };

    return {
        generate
    };
};
