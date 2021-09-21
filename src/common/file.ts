import fs from 'fs';

type Props = {
    content: Stream,
}

type Path = string
type Stream = string | NodeJS.ArrayBufferView

export class File {

    private readonly content: Stream

    constructor({ content }: Props) {
        this.content = content;
    }

    save(path: string, name: string): Path {
        const savedAt = `${process.cwd()}${path}/${name}`;

        fs.writeFileSync(savedAt, this.content);

        return savedAt;
    }
}