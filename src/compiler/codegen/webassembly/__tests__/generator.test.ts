import type { CodeGeneratorOutputOptions } from "../../codegenerator";
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import { CompilationHelper } from "../../../../../test/compiler/helper";
import { File } from "../../../../common/file";

describe('WebAssemblyGenerator', () => {

    let outputOptions: CodeGeneratorOutputOptions;

    let directoryPath: string;

    let filePathWithoutExtension: string;

    let wasm: string;
    let wat: string;
    let ts: string;

    const generateNewOutputPath = () => {
        outputOptions = {
            path: `/test/${uuid()}`,
            name: `main`
        };

        directoryPath = `${process.cwd()}${outputOptions.path}`;

        filePathWithoutExtension = `${directoryPath}/${outputOptions.name}`;

        wasm = `${filePathWithoutExtension}.wasm`;
        wat = `${filePathWithoutExtension}.wat`;
        ts = `${filePathWithoutExtension}.ts`;
    };

    beforeEach(() => {
        generateNewOutputPath();

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
            variable: number
            boolean: boolean
            function: () => number
        }

        const module = await compileAndImport<Module>(`
            export variable = const 1;
            export boolean = const true;
            export function = fun (): int {
                -(1 + 3) / 2 + variable;
            }
        `);

        expect(module.function()).toEqual(-1);
        expect(module.variable).toEqual(1);
        expect(module.boolean === true).toBeTruthy();
    });

    it('can call an exported function with parameters', async () => {
        type Module = {
            canDriveAt: (age: number) => boolean
        }

        const module = await compileAndImport<Module>(`
            MINIMAL_DRIVING_AGE = const 17;    

            export canDriveAt = fun (age: int): bool {
                age >= MINIMAL_DRIVING_AGE;
            }
        `);

        expect(module.canDriveAt(17)).toBeTruthy();
        expect(module.canDriveAt(16)).toBeFalsy();
    });

    it('it should correctly output typescript module', async () => {
        await compileAndImport(`
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

    const compileAndImport = async <T extends object> (module: string) => {
        const { tokenize, parse, resolve, codegenWebAssembly } = CompilationHelper;

        await codegenWebAssembly(resolve(parse(tokenize(module))), outputOptions);

        const imported = await import(ts);
        return imported.default(wasm) as T;
    };
});