import { File } from "../../../../common/file";
import wabt from 'wabt';
import { readFileSync } from "fs";

export const generateWASMFromFile = async (pathToWat: string): Promise<File> => {
    const { parseWat } = await wabt();

    const module = parseWat(pathToWat, readFileSync(pathToWat, 'utf-8'));
    const binary = module.toBinary({});
    const binaryBuffer = Buffer.from(binary.buffer);

    return new File({ content: binaryBuffer });
};