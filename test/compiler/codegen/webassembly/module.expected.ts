import fs from 'fs';

export interface Main {
    pi: number
    isMathModule: boolean
    square: (num: number) => number
}

const mount = (pathToWasm: string): Main => {
    const created = fs.readFileSync(pathToWasm);
    const wasmModule = new WebAssembly.Module(created);
    const { exports } = new WebAssembly.Instance(wasmModule) as any;

    return {
        pi: exports.pi.value,
        isMathModule: Boolean(exports.isMathModule.value),
        square: exports.square,
    };
};

export default mount;