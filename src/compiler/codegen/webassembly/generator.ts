import type Module from "module";
import type { CodeGenerator } from "../codegenerator";

type WATGenerator = CodeGenerator
type WATGeneratorFactory = () => WATGenerator

export const createWARGenerator: WATGeneratorFactory = () => {

    const generate = (module: Module, outputPath: string) => {
        return undefined;
    };

    return {
        generate
    };
};
