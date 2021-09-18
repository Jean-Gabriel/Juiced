import type { CodeGeneratorOutputOptions } from "../../codegenerator";
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import { CompilationHelper } from "../../../../../test/compiler/helper";

describe('WebAssemblyGenerator', () => {
    const outputOptions: CodeGeneratorOutputOptions = {
        path: `/test`,
        name: uuid()
    };

    const filePathWithoutExtension = `${process.cwd()}${outputOptions.path}/${outputOptions.name}`;

    const wasm = `${filePathWithoutExtension}.wasm`;
    const wat = `${filePathWithoutExtension}.wat`;

    afterEach(() => {
        fs.unlinkSync(wasm);
        fs.unlinkSync(wat);
    });

    it('can export functions and variables', async () => {
        type Module = {
            variable: WebAssembly.Global
            function: () => number
        }

        const module = await mount<Module>(`
            export variable = const 1;
            export function = fun (): int {
                -(1 + 3) / 2 + variable;
            }
        `);

        expect(module.function()).toEqual(-1);
        expect(module.variable.value).toEqual(1);
    });

    it('can call an exported function with parameters', async () => {
        type Module = {
            canDriveAt: (age: number) => boolean
        }

        const module = await mount<Module>(`
            MINIMAL_DRIVING_AGE = const 17;    

            export canDriveAt = fun (age: int): bool {
                age >= MINIMAL_DRIVING_AGE;
            }
        `);

        expect(module.canDriveAt(17)).toBeTruthy();
        expect(module.canDriveAt(16)).toBeFalsy();
    });

    const mount = async <T extends WebAssembly.Exports> (module: string) => {
        const { tokenize, parse, resolve, codegenWebAssembly } = CompilationHelper;

        await codegenWebAssembly(resolve(parse(tokenize(module))), outputOptions);

        interface MountedModule<T extends WebAssembly.Exports> extends WebAssembly.Instance {
            readonly exports: T
        }

        const created = fs.readFileSync(wasm);
        const wasmModule = new WebAssembly.Module(created);
        const wasmInstance = new WebAssembly.Instance(wasmModule) as MountedModule<T>;

        return wasmInstance.exports;
    };
});