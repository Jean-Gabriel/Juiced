import path from "path";
import { File } from "../../../../common/file";
import wabt from 'wabt';

type GenerationOptions = {
    watFile: string
}

export const generateWASM = async (wat: File, { watFile }: GenerationOptions): Promise<File> => {
    const { parseWat } = await wabt();

    const module = parseWat(path.join(__dirname, watFile), wat.read());
    const binary = module.toBinary({});
    const binaryBuffer = Buffer.from(binary.buffer);

    return new File({ content: binaryBuffer });
};