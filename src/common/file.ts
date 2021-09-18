import fs from 'fs';

type Props = {
    content: string | Buffer,
}

type Path = string

export class File {

    private readonly content: string | Buffer

    constructor({ content }: Props) {
        this.content = content;
    }

    save(path: string, name: string): Path {
        const savedAt = `${process.cwd()}${path}/${name}`;

        fs.writeFileSync(savedAt, this.content);

        return savedAt;
    }

    read() {
        return this.content;
    }
}