import { File } from "../../../../common/file";
import wabt from 'wabt';
import { readFileSync } from "fs";

type Path = string;

export const generateWASM = async (wat: Path): Promise<File> => {
    const { parseWat } = await wabt();

    const module = parseWat(wat, readFileSync(wat, 'utf-8'));
    const binary = module.toBinary({});
    const binaryBuffer = Buffer.from(binary.buffer);

    return new File({ content: binaryBuffer });
};