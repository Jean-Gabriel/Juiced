import { unlinkSync } from "fs";
import { File } from "../file";

describe('file', () => {
    it('should read existing file from given path', () => {
        const file = File.read(`${process.cwd()}/test/common/read_file_test.txt`);

        const content = file.asString();

        expect(content).toEqual('Hello world!');
    });

    it('should save file at path starting at current working directory', () => {
        const file = new File({ content: 'Hello world!' });

        const path = file.saveFromCwd('/test/common', 'save_file_test.txt');

        const read = File.read(path);
        unlinkSync(path);

        expect(read.asString()).toEqual('Hello world!');
    });
});