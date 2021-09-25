import type { CodeGeneratorOutputOptions } from "../../codegenerator";
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import { CompilationHelper } from "../../../../../test/compiler/helper";
import { File } from "../../../../common/file";

describe('WebAssemblyGenerator', () => {
    const outputOptions: CodeGeneratorOutputOptions = {
        path: `/test/${uuid()}`,
        name: 'main'
    };

    const directoryPath = `${process.cwd()}${outputOptions.path}`;

    const filePathWithoutExtension = `${directoryPath}/${outputOptions.name}`;

    const wasm = `${filePathWithoutExtension}.wasm`;
    const wat = `${filePathWithoutExtension}.wat`;
    const ts = `${filePathWithoutExtension}.ts`;

    beforeEach(() => {
        fs.mkdirSync(directoryPath);
    });

    afterEach(() => {
        fs.unlinkSync(wasm);
        fs.unlinkSync(wat);
        fs.unlinkSync(ts);

        fs.rmdirSync(directoryPath);
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

    it('it should correctly output typescript module', async () => {
        await mount(`
            export pi = const 3.1416;
            export isMathModule = const true;

            export square = fun (num: int): int {
                num * num;
            }
        `);

        const output = File.read(ts);

        const expected = File.read(`${process.cwd()}/test/compiler/codegen/webassembly/module.expected.ts`);
        expect(output.asString()).toEqual(expected.asString());
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