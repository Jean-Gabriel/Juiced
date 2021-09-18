import type { Module } from "../../ast/nodes/module";
import type { CodeGenerator } from "../codegenerator";
import { generateWASM } from "./wasm/generate";
import { generateWAT } from "./wat/generate";

type WebAssemblyGenerator = CodeGenerator
type WebAssemblyGeneratorFactory = () => WebAssemblyGenerator

type OutputOptions = {
    path: string
    name: string
}

export const createWebAssemblyGenerator: WebAssemblyGeneratorFactory = () => {
    const generate = (module: Module, { path, name = 'main' }: OutputOptions) => {
        const watName = `${name}.wat`;
        const wasmName = `${name}.wasm`;

        const wat = generateWAT(module);
        wat.save(path, watName);

        generateWASM(wat, { watFile: watName }).then((wasm => wasm.save(path, wasmName)));
    };

    return {
        generate
    };
};
