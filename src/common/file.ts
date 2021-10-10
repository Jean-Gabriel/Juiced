import fs from 'fs';

type Props = {
    content: Stream,
}

type Path = string
type Stream = string | NodeJS.ArrayBufferView

export class File {
    static read(pathToTemplate: string) {
        const read = fs.readFileSync(pathToTemplate, { encoding: 'utf-8' });

        return new File({ content: read });
    }

    private static decoder = new TextDecoder("utf-8");

    private readonly content: Stream

    constructor({ content }: Props) {
        this.content = content;
    }

    saveFromCwd(path: string, name: string): Path {
        const savedAt = `${process.cwd()}/${path}/${name}`;

        fs.writeFileSync(savedAt, this.content);

        return savedAt;
    }

    asString(): string {
        if(typeof this.content !== 'string') {
            return File.decoder.decode(this.content);
        }

        return this.content;
    }
}